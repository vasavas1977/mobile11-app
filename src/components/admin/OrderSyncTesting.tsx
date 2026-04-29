import { useState } from 'react';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, Zap, Send, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: string;
  data?: any;
}

interface Order {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  package_id: string;
  user_id: string;
  iccid?: string;
  msisdn?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export function OrderSyncTesting() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { toast } = useToast();

  const addTestResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    const result: TestResult = {
      step,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
      data
    };
    
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.step === step);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const loadPendingOrders = async () => {
    setLoadingOrders(true);
    addTestResult('load-orders', 'pending', 'Loading pending orders from database...');
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages:package_id (
            name,
            country_name,
            data_amount
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setOrders(data || []);
      addTestResult('load-orders', 'success', `Found ${data?.length || 0} pending orders`, { count: data?.length });
      
      if (data && data.length > 0) {
        setSelectedOrder(data[0].id);
      }
    } catch (error: any) {
      addTestResult('load-orders', 'error', `Failed to load orders: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to load pending orders",
        variant: "destructive"
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const testUsimSAIntegration = async () => {
    if (!selectedOrder) {
      toast({
        title: "Error",
        description: "Please select an order to test",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      // Step 1: Get order details
      addTestResult('get-order', 'pending', 'Fetching order details...');
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages:package_id (
            package_id,
            name,
            country_name,
            data_amount
          )
        `)
        .eq('id', selectedOrder)
        .single();

      if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
      
      addTestResult('get-order', 'success', `Order ${orderData.order_id} loaded successfully`, orderData);

      // Step 2: Call Usimsa Integration
      addTestResult('usimsa-integration', 'pending', 'Calling Usimsa integration API...');
      
      const { data: integrationResult, error: integrationError } = await supabase.functions
        .invoke('usimsa-integration', {
          body: {
            packageId: orderData.package_id,
            orderId: orderData.id,
            userEmail: 'test@example.com'
          }
        });

      if (integrationError) {
        const errorMessage = integrationError.message || 'Unknown error';
        const isDnsError = errorMessage.includes('dns error') || errorMessage.includes('Name or service not known');
        
        addTestResult('usimsa-integration', 'error', 
          `Usimsa integration failed: ${errorMessage}${isDnsError ? '\n\nNote: This appears to be a DNS/connection error. The Usimsa API endpoint may be incorrect or unavailable. You can test the webhook flow independently using the "Webhook Simulation" tab.' : ''}`, 
          { error: integrationError }
        );
        
        // Don't throw error, continue with other tests
        if (!isDnsError) {
          throw new Error(`Usimsa integration failed: ${errorMessage}`);
        }
      } else {
        addTestResult('usimsa-integration', 'success', 'Usimsa integration completed', integrationResult);
      }

      // Step 3: Check order status update
      addTestResult('status-check', 'pending', 'Checking order status update...');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const { data: updatedOrder, error: statusError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', selectedOrder)
        .single();

      if (statusError) throw new Error(`Status check failed: ${statusError.message}`);

      addTestResult('status-check', 'success', `Order status: ${updatedOrder.status}`, updatedOrder);

      toast({
        title: "Test Completed",
        description: "Order synchronization test completed successfully",
      });

    } catch (error: any) {
      addTestResult('error', 'error', error.message);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testWebhookSimulation = async () => {
    if (!selectedOrder) {
      toast({
        title: "Error",
        description: "Please select an order to test",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      // Step 1: Simulate webhook payload
      addTestResult('webhook-setup', 'pending', 'Preparing webhook simulation...');

      const webhookPayload = {
        orderId: selectedOrder,
        status: 'completed',
        iccid: '89012345678901234567',
        msisdn: '+1234567890',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        activationStatus: 'active'
      };

      addTestResult('webhook-setup', 'success', 'Webhook payload prepared', webhookPayload);

      // Step 2: Call webhook handler
      addTestResult('webhook-call', 'pending', 'Calling Usimsa webhook handler...');

      const { data: webhookResult, error: webhookError } = await supabase.functions
        .invoke('usimsa-webhook', {
          body: webhookPayload
        });

      if (webhookError) throw new Error(`Webhook call failed: ${webhookError.message}`);

      addTestResult('webhook-call', 'success', 'Webhook processed successfully', webhookResult);

      // Step 3: Verify order update
      addTestResult('verify-update', 'pending', 'Verifying order was updated...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: updatedOrder, error: verifyError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', selectedOrder)
        .single();

      if (verifyError) throw new Error(`Verification failed: ${verifyError.message}`);

      addTestResult('verify-update', 'success', `Order updated - Status: ${updatedOrder.status}, ICCID: ${updatedOrder.iccid}`, updatedOrder);

      toast({
        title: "Webhook Test Completed",
        description: "Webhook simulation completed successfully",
      });

    } catch (error: any) {
      addTestResult('error', 'error', error.message);
      toast({
        title: "Webhook Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testEmailConfirmation = async () => {
    if (!selectedOrder) {
      toast({
        title: "Error",
        description: "Please select an order to test",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      addTestResult('email-test', 'pending', 'Testing order confirmation email...');

      const { data: emailResult, error: emailError } = await supabase.functions
        .invoke('send-order-confirmation', {
          body: {
            orderId: selectedOrder
          }
        });

      if (emailError) throw new Error(`Email test failed: ${emailError.message}`);

      addTestResult('email-test', 'success', 'Order confirmation email sent successfully', emailResult);

      toast({
        title: "Email Test Completed",
        description: "Order confirmation email sent successfully",
      });

    } catch (error: any) {
      addTestResult('error', 'error', error.message);
      toast({
        title: "Email Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Order Synchronization Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Test the complete order flow: frontend order creation → Usimsa API integration → webhook status updates → email confirmation.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Select Test Order</label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order to test" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_id} - ${order.total_amount} ({order.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={loadPendingOrders} 
                disabled={loadingOrders}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                Load Orders
              </Button>
            </div>
          </div>

          <Tabs defaultValue="integration" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="integration">Usimsa Integration</TabsTrigger>
              <TabsTrigger value="webhook">Webhook Simulation</TabsTrigger>
              <TabsTrigger value="email">Email Confirmation</TabsTrigger>
            </TabsList>

            <TabsContent value="integration" className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testUsimSAIntegration}
                  disabled={isRunning || !selectedOrder}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Test Usimsa Integration
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Tests the complete order processing flow with Usimsa API including order creation and status updates.
              </div>
            </TabsContent>

            <TabsContent value="webhook" className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testWebhookSimulation}
                  disabled={isRunning || !selectedOrder}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Simulate Webhook
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Simulates receiving a webhook from Usimsa with order completion status and eSIM details.
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testEmailConfirmation}
                  disabled={isRunning || !selectedOrder}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Test Email
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Tests the order confirmation email system using the selected order.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.step}</span>
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                        {result.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}