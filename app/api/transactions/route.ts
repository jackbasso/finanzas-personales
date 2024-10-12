import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    client = await clientPromise;
  }
  return client;
}

export async function GET() {
  try {
    const client = await getClient();
    const db = client.db();
    const transactions = await db.collection("transactions").find().sort({ date: -1 }).toArray();
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
    const client = await getClient();
    const db = client.db();
    const result = await db.collection("transactions").insertOne(body);
    console.log("Transaction saved:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error saving transaction:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
