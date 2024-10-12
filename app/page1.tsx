"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart";
import { toast } from "../components/ui/use-toast";

type Transaction = {
  _id: string;
  type: "ingreso" | "gasto";
  amount: number;
  category: string;
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
      console.log("Transactions fetched:", data.length);
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
      category,
      description,
    };
    try {
      console.log("Submitting transaction:", newTransaction);
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
      const savedTransaction = await response.json();
      console.log("Transaction saved:", savedTransaction);
      await fetchTransactions();
      setAmount("");
      setDescription("");
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

  const barChartData = [
    { name: "Ingresos", value: totalIncome },
    { name: "Gastos", value: totalExpenses },
  ];

  const pieChartData = CATEGORIES.map((cat) => ({
    name: cat,
    value: transactions.filter((t) => t.type === "gasto" && t.category === cat).reduce((sum, t) => sum + t.amount, 0),
  })).filter((item) => item.value > 0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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
            </div>
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
            <ChartContainer
              config={{
                value: {
                  label: "Monto",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <Bar dataKey="value" fill="var(--color-value)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
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
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
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
                <span className="font-bold">
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
