"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Plus, Minus, LogOut } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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

  const pieChartData = CATEGORIES.map((category) => ({
    name: category,
    value: transactions
      .filter((t) => t.type === "gasto" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0),
  })).filter((item) => item.value > 0);

  return (
    <div className="container mx-auto p-4 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Finanzas Personales</h1>
        <Button onClick={() => signOut()} variant="outline">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </Button>
      </div>
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
            <CardTitle>Distribución de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {transactions
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((transaction) => {
                const date = new Date(transaction.date);
                const formattedDate = `${("0" + (date.getMonth() + 1)).slice(-2)}/${("0" + date.getDate()).slice(
                  -2
                )}/${date.getFullYear().toString().slice(-2)}`;
                return (
                  <li
                    key={transaction._id}
                    className={`flex justify-between items-center p-2 rounded ${
                      transaction.type === "ingreso" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <span>{transaction.description}</span>
                    <span className={`font-bold ${transaction.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                      {formattedDate} {transaction.type === "ingreso" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
