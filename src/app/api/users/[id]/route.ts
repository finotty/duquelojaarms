import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userDoc = doc(db, 'users', params.id);
    const userSnapshot = await getDoc(userDoc);

    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userData = userSnapshot.data();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userData = await request.json();
    const userDoc = doc(db, 'users', params.id);
    
    await updateDoc(userDoc, {
      ...userData,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Dados atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar dados do usuário' },
      { status: 500 }
    );
  }
} 