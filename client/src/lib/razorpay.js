const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  orderId,
  amount,
  currency = "INR",
  name = "EcoXchange",
  description,
  user,
  onSuccess,
  onFailure,
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    onFailure?.(new Error("Razorpay SDK failed to load"));
    return;
  }

  const options = {
    key: KEY,
    amount,
    currency,
    name,
    description,
    order_id: orderId,
    prefill: {
      name: user?.name,
      email: user?.email,
      contact: user?.phone,
    },
    handler: (response) => onSuccess?.(response),
    modal: {
      ondismiss: () => onFailure?.(new Error("Payment cancelled")),
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", (res) => onFailure?.(new Error(res.error?.description || "Payment failed")));
  rzp.open();
}
