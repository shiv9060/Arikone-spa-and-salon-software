"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SendInvoiceWhatsAppBtn({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/whatsapp`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast({ title: "Success", description: "Invoice sent via WhatsApp" });
      } else {
        toast({ title: "Failed", description: data.error || "Failed to send invoice", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 disabled:opacity-50"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {loading ? "Sending..." : "Send Invoice on WhatsApp"}
    </button>
  );
}
