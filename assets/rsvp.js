/* Apps Script receipt lookup returns only the status of a random capability.
 * Guest details travel in POST bodies, never in a receipt URL.
 */
(() => {
  const endpoint = 'https://script.google.com/macros/s/AKfycbzM19FpjYKGWMYVw_ZpFX3EtF5HeMr2e1Rt4ASBqbe_lHnSa581iTgSHnZ5eeDkkDncTQ/exec';
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  function receipt(receiptToken) {
    return new Promise((resolve, reject) => {
      const callback = 'cpRsvpReceipt_' + token();
      const script = document.createElement('script');
      const finish = (error, value) => {
        clearTimeout(timer);
        script.remove();
        window[callback] = () => {};
        setTimeout(() => { delete window[callback]; }, 60000);
        error ? reject(error) : resolve(value);
      };
      const timer = setTimeout(() => finish(new Error('receipt timeout')), 10000);
      window[callback] = result => finish(null, result);
      script.onerror = () => finish(new Error('receipt unavailable'));
      script.src = endpoint + '?action=receipt&token=' + encodeURIComponent(receiptToken) + '&callback=' + callback;
      document.head.append(script);
    });
  }
  async function submit(entry) {
    const receiptToken = token();
    const payload = { ...entry, version: 2, receiptToken };
    // Retry keeps response ID/edit token, avoiding duplicate rows after a lost ack.
    const controller = new AbortController();
    const requestTimer = setTimeout(() => controller.abort(), 15000);
    let result;
    try {
      const response = await fetch(endpoint, { method: 'POST', redirect: 'follow', credentials: 'omit', signal: controller.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      if (response.ok) result = await response.json();
    } catch { /* The write may have succeeded even if CORS or the connection hid its response. */ }
    finally { clearTimeout(requestTimer); }
    if (result?.status === 'saved' && result.id === entry.id && result.receiptToken === receiptToken) return;
    if (result?.status === 'error') throw new Error(result.message || 'Please check your reply and try again.');
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      try {
        const result = await receipt(receiptToken);
        if (result.status === 'saved' && result.id === entry.id) return;
      } catch { /* Bound the verification wait; never show success without a receipt. */ }
    }
    throw new Error('We couldn’t confirm your reply was saved. Your details are still here—please try again. If this continues, message Paul or Claire.');
  }
  window.WeddingRsvp = { submit, identity: () => ({ id: crypto.randomUUID(), editToken: token() }) };
})();
