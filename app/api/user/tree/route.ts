import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

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

async function isDescendant(childId: string, ancestorId: string): Promise<boolean> {
  let currentId = childId;
  while (currentId) {
    const res = await db.execute({
      sql: 'SELECT parentId FROM Users WHERE id = ?',
      args: [currentId]
    });
    const row = res.rows[0] as any;
    if (!row || !row.parentId) break;
    if (row.parentId === ancestorId) return true;
    currentId = row.parentId;
  }
  return false;
}

async function getTreeNode(userId: string, depth: number, maxDepth: number): Promise<TreeNode | null> {
  if (depth > maxDepth) return null;

  const res = await db.execute({
    sql: `
      SELECT id, fullName, createdAt, status, role, leftCount, rightCount 
      FROM Users WHERE id = ?
    `,
    args: [userId]
  });
  const user = res.rows[0] as any;

  if (!user) return null;

  const node: TreeNode = {
    id: user.id,
    fullName: user.fullName,
    createdAt: user.createdAt,
    status: user.status,
    role: user.role,
    leftCount: user.leftCount as number,
    rightCount: user.rightCount as number,
    left: null,
    right: null,
  };

  if (depth < maxDepth) {
    const childrenRes = await db.execute({
      sql: 'SELECT id, position FROM Users WHERE parentId = ?',
      args: [userId]
    });
    const children = childrenRes.rows as any[];
    
    const leftChild = children.find(c => c.position === 'LEFT');
    const rightChild = children.find(c => c.position === 'RIGHT');

    if (leftChild) {
      node.left = await getTreeNode(leftChild.id, depth + 1, maxDepth);
    }
    if (rightChild) {
      node.right = await getTreeNode(rightChild.id, depth + 1, maxDepth);
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
      const targetUserRes = await db.execute({
        sql: 'SELECT id FROM Users WHERE id = ? OR email = ?',
        args: [trimmedTarget, trimmedTarget.toLowerCase()]
      });
      const targetUser = targetUserRes.rows[0] as any;
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Access Control: Only admins can view arbitrary nodes. Users can only view their own downline tree.
      if (!session.isAdmin && targetUser.id !== session.userId) {
        const allowed = await isDescendant(targetUser.id, session.userId);
        if (!allowed) {
          return NextResponse.json({ error: 'Forbidden: You can only view your own downline tree structure' }, { status: 403 });
        }
      }
      resolvedTargetId = targetUser.id;
    } else {
      // Validate that the session user actually exists in the database
      const sessionUserRes = await db.execute({
        sql: 'SELECT id FROM Users WHERE id = ?',
        args: [session.userId]
      });
      if (sessionUserRes.rows.length === 0) {
        return NextResponse.json({ error: 'Unauthorized: Session user does not exist' }, { status: 401 });
      }
    }

    // Build the tree (up to 3 levels: Root, children, grandchildren)
    const tree = await getTreeNode(resolvedTargetId, 0, 2);

    if (!tree) {
      return NextResponse.json({ error: 'User tree not found' }, { status: 404 });
    }

    // Provide parent details to navigate up
    let parentUsername = null;
    const currentUserRes = await db.execute({
      sql: 'SELECT parentId FROM Users WHERE id = ?',
      args: [resolvedTargetId]
    });
    const currentUser = currentUserRes.rows[0] as any;
    if (currentUser && currentUser.parentId) {
      // Security check for regular users navigating up: can't go above their session root
      if (session.isAdmin || resolvedTargetId !== session.userId) {
        // Can only navigate up if the current node is not the logged-in user's root node
        const allowedToNavUp = session.isAdmin || await isDescendant(resolvedTargetId, session.userId) || resolvedTargetId !== session.userId;
        
        if (session.isAdmin || currentUser.parentId === session.userId || await isDescendant(currentUser.parentId, session.userId)) {
          const parentRes = await db.execute({
            sql: 'SELECT id FROM Users WHERE id = ?',
            args: [currentUser.parentId]
          });
          const parent = parentRes.rows[0] as any;
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
