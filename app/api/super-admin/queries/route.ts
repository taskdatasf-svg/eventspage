import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const queries = await prisma.supportQuery.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, queries });
  } catch (error) {
    console.error('Error fetching support queries:', error);
    return NextResponse.json({ error: 'Failed to fetch support queries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Please provide name, email, subject, and message' }, { status: 400 });
    }

    const newQuery = await prisma.supportQuery.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, query: newQuery });
  } catch (error) {
    console.error('Error creating support query:', error);
    return NextResponse.json({ error: 'Failed to submit support query' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Query ID and status are required' }, { status: 400 });
    }

    const updatedQuery = await prisma.supportQuery.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, query: updatedQuery });
  } catch (error) {
    console.error('Error updating support query status:', error);
    return NextResponse.json({ error: 'Failed to update query status' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 });
    }

    await prisma.supportQuery.delete({ where: { id: queryId } });

    return NextResponse.json({ success: true, message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Error deleting support query:', error);
    return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 });
  }
}
