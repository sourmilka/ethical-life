/**
 * Payment Page — Entry point for payment.html
 */

// ===== BarterPay Payment Integration =====
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const PAYMENT_AMOUNT = 149;

// Elements
const payLoading = document.getElementById('payLoading');
const payError = document.getElementById('payError');
const payIframe = document.getElementById('payIframe');
const payRetryBtn = document.getElementById('payRetryBtn');

// Verify intake exists
const params = new URLSearchParams(window.location.search);
const intakeId = params.get('intakeId');

if (!intakeId) {
  window.location.href = '/pages/forms.html';
}

let pollingInterval = null;
let currentTransactionId = null;

// ===== Create BarterPay Transaction (via backend proxy) =====

async function createTransaction() {
  showLoading();

  try {
    const response = await fetch(
      BACKEND_URL + '/api/barterpay/create-transaction',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId: intakeId,
          amount: PAYMENT_AMOUNT,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }

    const data = await response.json();

    if (!data.ok || !data.redirectUrl) {
      throw new Error(data.error || 'No checkout URL received');
    }

    currentTransactionId = data.transactionId;

    payIframe.src = data.redirectUrl;
    payLoading.style.display = 'none';
    payIframe.style.display = 'block';

    if (currentTransactionId) {
      startPolling(currentTransactionId);
    }
  } catch {
    showError();
  }
}

// ===== Poll Transaction Status (via backend proxy) =====

function startPolling(transactionId) {
  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(
        BACKEND_URL + '/api/barterpay/check-status',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: transactionId,
            intakeId: intakeId,
          }),
        },
      );

      if (!response.ok) return;

      const data = await response.json();
      const status = (data.status || '').toLowerCase();

      if (
        status === 'completed' ||
        status === 'success' ||
        status === 'paid'
      ) {
        clearInterval(pollingInterval);
        onPaymentSuccess();
      }
    } catch {
      // Silently retry on next interval
    }
  }, 3000);
}

// ===== Payment Success =====

function onPaymentSuccess() {
  try {
    const intake = JSON.parse(
      localStorage.getItem('ethicallife_intake') || '{}',
    );
    intake._paymentStatus = 'completed';
    intake._paidAt = new Date().toISOString();
    intake._status = 'new';
    localStorage.setItem('ethicallife_intake', JSON.stringify(intake));
  } catch {
    /* localStorage unavailable */
  }

  window.location.href =
    '/pages/thank-you.html?payment=success&intakeId=' +
    encodeURIComponent(intakeId);
}

// ===== UI Helpers =====

function showLoading() {
  payLoading.style.display = 'flex';
  payError.style.display = 'none';
  payIframe.style.display = 'none';
}

function showError() {
  payLoading.style.display = 'none';
  payError.style.display = 'block';
  payIframe.style.display = 'none';
}

payRetryBtn.addEventListener('click', () => {
  createTransaction();
});

// ===== Init =====
createTransaction();
