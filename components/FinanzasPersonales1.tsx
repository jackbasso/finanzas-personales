"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

type Transaction = {
  _id: string;
  type: "ingreso" | "gasto";
  amount: number;
  category?: string;
  description: string;
  date: Date;
};

const CATEGORIES = ["Comida", "Transporte", "Entretenimiento", "Servicios", "Otros"];

export default function FinanzasPersonales() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] = useState<"ingreso" | "gasto">("gasto");
  const [date, setDate] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: `No se pudieron cargar las transacciones: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction = {
      type: transactionType,
      amount: parseFloat(amount),
      category: transactionType === "gasto" ? category : undefined,
      description,
      date: new Date(date),
    };
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      await fetchTransactions();
      setAmount("");
      setDescription("");
      setDate("");
      toast({
        title: "Éxito",
        description: "Transacción agregada correctamente",
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: `No se pudo agregar la transacción: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const totalIncome = transactions.reduce(
    (sum, transaction) => (transaction.type === "ingreso" ? sum + transaction.amount : sum),
    0
  );
  const totalExpenses = transactions.reduce(
    (sum, transaction) => (transaction.type === "gasto" ? sum + transaction.amount : sum),
    0
  );

  const balance = totalIncome - totalExpenses;

  const barChartData = [
    { name: "Ingresos", value: totalIncome },
    { name: "Gastos", value: totalExpenses },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Mis Finanzas Personales</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nueva Transacción</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={transactionType === "ingreso" ? "default" : "outline"}
                onClick={() => setTransactionType("ingreso")}
              >
                <Plus className="mr-2 h-4 w-4" /> Ingreso
              </Button>
              <Button
                type="button"
                variant={transactionType === "gasto" ? "default" : "outline"}
                onClick={() => setTransactionType("gasto")}
              >
                <Minus className="mr-2 h-4 w-4" /> Gasto
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </div>
            {transactionType === "gasto" && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <Button type="submit">Agregar Transacción</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => (
              <li
                key={transaction._id}
                className={`flex justify-between items-center p-2 rounded ${
                  transaction.type === "ingreso" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <span>{transaction.description}</span>
                <span className={`font-bold ${transaction.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                  {transaction.type === "ingreso" ? "+" : "-"}${transaction.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
