import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  type: "ingreso" | "gasto";
  amount: number;
  category?: string;
  description: string;
  date: Date;
}

const TransactionSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ["ingreso", "gasto"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: function (this: ITransaction) {
      return this.type === "gasto";
    },
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save hook to ensure category is not set for 'ingreso' type
TransactionSchema.pre("save", function (this: ITransaction, next) {
  if (this.type === "ingreso") {
    this.category = undefined;
  }
  next();
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
