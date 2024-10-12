import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await clientPromise;
    const transactions = await Transaction.find().sort({ date: -1 });
    console.log("Transactions fetched:", transactions.length);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received transaction data:", body);
    await clientPromise;
    const newTransaction = new Transaction({
      type: body.type,
      amount: body.amount,
      category: body.type === "gasto" ? body.category : undefined,
      description: body.description,
      date: new Date(body.date),
    });
    const savedTransaction = await newTransaction.save();
    console.log("Transaction saved:", savedTransaction);
    return NextResponse.json(savedTransaction, { status: 201 });
  } catch (error) {
    console.error("Error saving transaction:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
