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

  function updateButton() {
    const supported = OneSignal.Notifications.isPushSupported();
    button.hidden = !supported;
    if (!supported) return;

    const permission = OneSignal.Notifications.permission;
    const optedIn = OneSignal.User.PushSubscription.optedIn;
    const active = permission && optedIn;

    button.classList.toggle("push-on", active);
    button.setAttribute("aria-label", active ? "Desativar notificações" : "Ativar notificações");
    button.setAttribute("title", active ? "Notificações ativadas" : "Ativar notificações");
    button.textContent = active ? "✓" : "♢";
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
