window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "3427bd6a-c26d-4012-aeb6-da914976847c",
    serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
    serviceWorkerParam: { scope: "/cronograma-biblico-2027/push/onesignal/" },
    notifyButton: { enable: false },
    welcomeNotification: { disable: true },
    autoResubscribe: true,
    notificationClickHandlerMatch: "origin",
    notificationClickHandlerAction: "navigate"
  });

  const button = document.getElementById("pushToggle");
  if (!button) return;

  const bellOn = `
    <svg class="top-icon push-bell" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>`;

  const bellOff = `
    <svg class="top-icon push-bell" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-10.2-4.3" />
      <path d="M6 8c0 7-3 7-3 9h14" />
      <path d="M10 21h4" />
      <path d="M3 3l18 18" />
    </svg>`;

  function updateButton() {
    const supported = OneSignal.Notifications.isPushSupported();
    button.hidden = !supported;
    if (!supported) return;

    const permission = OneSignal.Notifications.permission;
    const optedIn = OneSignal.User.PushSubscription.optedIn;
    const active = Boolean(permission && optedIn);

    button.classList.toggle("push-on", active);
    button.classList.toggle("push-off", !active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute("aria-label", active ? "Desativar notificações" : "Ativar notificações");
    button.setAttribute("title", active ? "Notificações ativadas" : "Notificações desativadas");
    button.innerHTML = active ? bellOn : bellOff;
  }

  button.addEventListener("click", async () => {
    if (!OneSignal.Notifications.isPushSupported()) {
      alert("Este navegador não oferece suporte a notificações web.");
      return;
    }

    try {
      if (!OneSignal.Notifications.permission) {
        await OneSignal.Notifications.requestPermission();
      } else if (OneSignal.User.PushSubscription.optedIn) {
        await OneSignal.User.PushSubscription.optOut();
      } else {
        await OneSignal.User.PushSubscription.optIn();
      }
    } catch (error) {
      console.error("Falha ao alterar notificações:", error);
    }

    updateButton();
  });

  OneSignal.Notifications.addEventListener("permissionChange", updateButton);
  OneSignal.User.PushSubscription.addEventListener("change", updateButton);
  updateButton();
});
