import { useState, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { OrderSyncTesting } from './OrderSyncTesting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export function AdminDeveloper() {
  const { toast } = useToast();

  // Email testing states
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_id, status, created_at, total_amount')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setOrders(data);
    }
  };

  const testEmailConfirmation = async () => {
    if (!selectedOrderId) {
      toast({
        title: "No order selected",
        description: "Please select an order to test email confirmation",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: { orderId: selectedOrderId }
      });

      if (error) throw error;

      toast({
        title: "Email sent successfully",
        description: `Confirmation email sent for order ${orders.find(o => o.id === selectedOrderId)?.order_id}`,
      });
    } catch (error: any) {
      console.error('Email test error:', error);
      toast({
        title: "Email sending failed",
        description: error.message || "Failed to send confirmation email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Developer Testing</h1>
          <p className="text-muted-foreground">Test email confirmations and order synchronization</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Confirmation Testing
          </CardTitle>
          <CardDescription>
            Test sending order confirmation emails to any user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Order</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an order to test" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_id} - {order.status} - {order.total_amount} ({new Date(order.created_at).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={testEmailConfirmation} 
            disabled={isSending || !selectedOrderId}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <OrderSyncTesting />
    </div>
  );
}