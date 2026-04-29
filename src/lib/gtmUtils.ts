// Google Tag Manager Utility Functions

// Push events to GTM dataLayer
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
};

// Track virtual page views (for SPA navigation)
export const trackPageView = (path: string, title?: string) => {
  pushToDataLayer({
    event: 'virtualPageview',
    pagePath: path,
    pageTitle: title || (typeof document !== 'undefined' ? document.title : ''),
  });
};

// E-commerce: View Item
export const trackViewItem = (item: {
  id: string;
  name: string;
  price: number;
  currency: string;
  category?: string;
  country?: string;
}) => {
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: item.currency,
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        currency: item.currency,
        item_category: item.category || 'eSIM',
        item_variant: item.country,
      }]
    }
  });
};

// E-commerce: Add to Cart
export const trackAddToCart = (item: {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  category?: string;
}) => {
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: item.currency,
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category || 'eSIM',
      }]
    }
  });
};

// E-commerce: Begin Checkout
export const trackBeginCheckout = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
}>, totalValue: number, currency: string) => {
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: currency,
      value: totalValue,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: 'eSIM',
      }))
    }
  });
};

// E-commerce: Purchase
export const trackPurchase = (transaction: {
  id: string;
  revenue: number;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) => {
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: transaction.id,
      value: transaction.revenue,
      currency: transaction.currency,
      items: transaction.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: 'eSIM',
      }))
    }
  });
};

// User events
export const trackSignUp = (method: string) => {
  pushToDataLayer({
    event: 'sign_up',
    method: method,
  });
};

export const trackLogin = (method: string) => {
  pushToDataLayer({
    event: 'login',
    method: method,
  });
};

// Custom events
export const trackAffiliateClick = (affiliateCode: string) => {
  pushToDataLayer({
    event: 'affiliate_click',
    affiliate_code: affiliateCode,
  });
};

// Declare global dataLayer type
declare global {
  interface Window {
    dataLayer: any[];
  }
}
