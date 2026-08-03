chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR" }, (response) => {
  if (response?.opened) {
    window.close();
  } else {
    document.getElementById('fallback').style.display = 'block';
    document.querySelector('.muted').textContent = 'Sidebar support is unavailable. Open settings instead.';
    document.getElementById('manage').addEventListener('click', () => chrome.runtime.openOptionsPage());
  }
});
