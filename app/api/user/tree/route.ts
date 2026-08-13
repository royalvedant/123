import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

interface TreeNode {
  id: string;
  fullName: string;
  createdAt: string;
  status: string;
  role: string;
  leftCount: number;
  rightCount: number;
  left?: TreeNode | null;
  right?: TreeNode | null;
}

function isDescendant(childId: string, ancestorId: string): boolean {
  let currentId = childId;
  const getParent = db.prepare('SELECT parentId FROM Users WHERE id = ?');
  while (currentId) {
    const row = getParent.get(currentId) as any;
    if (!row || !row.parentId) break;
    if (row.parentId === ancestorId) return true;
    currentId = row.parentId;
  }
  return false;
}

function getTreeNode(userId: string, depth: number, maxDepth: number): TreeNode | null {
  if (depth > maxDepth) return null;

  const user = db.prepare(`
    SELECT id, fullName, createdAt, status, role, leftCount, rightCount 
    FROM Users WHERE id = ?
  `).get(userId) as any;

  if (!user) return null;

  const node: TreeNode = {
    id: user.id,
    fullName: user.fullName,
    createdAt: user.createdAt,
    status: user.status,
    role: user.role,
    leftCount: user.leftCount,
    rightCount: user.rightCount,
    left: null,
    right: null,
  };

  if (depth < maxDepth) {
    const children = db.prepare('SELECT id, position FROM Users WHERE parentId = ?').all(userId) as any[];
    
    const leftChild = children.find(c => c.position === 'LEFT');
    const rightChild = children.find(c => c.position === 'RIGHT');

    if (leftChild) {
      node.left = getTreeNode(leftChild.id, depth + 1, maxDepth);
    }
    if (rightChild) {
      node.right = getTreeNode(rightChild.id, depth + 1, maxDepth);
    }
  }

  return node;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    let resolvedTargetId = session.userId;

    if (targetUserId) {
      const trimmedTarget = targetUserId.trim();
      const targetUser = db.prepare('SELECT id FROM Users WHERE id = ? OR email = ?').get(trimmedTarget, trimmedTarget.toLowerCase()) as any;
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Access Control: Only admins can view arbitrary nodes. Users can only view their own downline tree.
      if (session.role !== 'admin' && targetUser.id !== session.userId) {
        const allowed = isDescendant(targetUser.id, session.userId);
        if (!allowed) {
          return NextResponse.json({ error: 'Forbidden: You can only view your own downline tree structure' }, { status: 403 });
        }
      }
      resolvedTargetId = targetUser.id;
    }

    // Build the tree (up to 3 levels: Root, children, grandchildren)
    const tree = getTreeNode(resolvedTargetId, 0, 2);

    if (!tree) {
      return NextResponse.json({ error: 'Tree construction failed' }, { status: 500 });
    }

    // Provide parent details to navigate up
    let parentUsername = null;
    const currentUser = db.prepare('SELECT parentId FROM Users WHERE id = ?').get(resolvedTargetId) as any;
    if (currentUser && currentUser.parentId) {
      // Security check for regular users navigating up: can't go above their session root
      if (session.role === 'admin' || resolvedTargetId !== session.userId) {
        // Can only navigate up if the current node is not the logged-in user's root node
        const allowedToNavUp = session.role === 'admin' || isDescendant(resolvedTargetId, session.userId) || resolvedTargetId !== session.userId;
        
        // Wait, if resolvedTargetId is in session's downline, then resolvedTargetId's parent could also be in session's downline or be the session user themselves!
        // So we allow it if the parent is descendant or equals session user.
        if (session.role === 'admin' || currentUser.parentId === session.userId || isDescendant(currentUser.parentId, session.userId)) {
          const parent = db.prepare('SELECT id FROM Users WHERE id = ?').get(currentUser.parentId) as any;
          if (parent) parentUsername = parent.id;
        }
      }
    }

    return NextResponse.json({ tree, parentUsername });
  } catch (e: any) {
    console.error('Tree API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
