import React, { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { toast } from "react-toastify";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({
  amount,
  paymentType,
  bookingDetails,
  refundId,
  onSuccess,
  onError,
  onClose,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentReason, setPaymentReason] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!paymentReason.trim()) {
      toast.warning("Please enter a reason for payment");
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem("token");

      let response;
      if (paymentType === "booking") {
        response = await axios.post(
          "http://localhost:5000/api/payments/create-booking-payment",
          {
            amount,
            bookingDetails,
            reason: paymentReason,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        response = await axios.post(
          "http://localhost:5000/api/payments/create-refund-payment",
          {
            amount,
            refundId,
            reason: paymentReason,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      const { clientSecret, paymentIntentId, paymentId } = response.data;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              email: JSON.parse(localStorage.getItem("user"))?.email,
              name: `${JSON.parse(localStorage.getItem("user"))?.firstName} ${JSON.parse(localStorage.getItem("user"))?.lastName}`,
            },
          },
        },
      );

      if (error) {
        console.error("Payment error:", error);
        onError(error.message);
      } else if (paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent, { paymentId, paymentIntentId });
      }
    } catch (error) {
      console.error("Error:", error);
      onError(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#9e2146" },
    },
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="payment-header">
            <h3>
              {paymentType === "booking"
                ? "Complete Payment"
                : "Process Refund"}
            </h3>
            <button type="button" onClick={onClose} className="close-button">
              ×
            </button>
          </div>

          <div className="payment-details">
            <div className="amount-details">
              <span>Amount:</span>
              <strong>$ {amount.toLocaleString()}</strong>
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Payment *</label>
            <input
              type="text"
              className="form-control"
              value={paymentReason}
              onChange={(e) => setPaymentReason(e.target.value)}
              placeholder="Enter reason for payment"
              required
            />
          </div>

          <div className="form-group">
            <label>Card Details</label>
            <div className="card-element-wrapper">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="payment-info">
            <p className="secure-badge">🔒 Secure payment powered by Stripe</p>
          </div>

          <button
            type="submit"
            disabled={!stripe || processing}
            className={`pay-button ${processing ? "processing" : ""}`}
          >
            {processing
              ? "Processing..."
              : `Pay LKR ${amount.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const Payment = ({
  amount,
  paymentType,
  bookingDetails,
  refundId,
  isOpen,
  onSuccess,
  onError,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        paymentType={paymentType}
        bookingDetails={bookingDetails}
        refundId={refundId}
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    </Elements>
  );
};

export default Payment;
