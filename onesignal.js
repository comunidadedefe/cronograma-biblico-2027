window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
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

  function setBusy(busy) {
    button.classList.toggle("push-busy", busy);
    button.disabled = busy;
  }

  function getPushState() {
    const supported = OneSignal.Notifications.isPushSupported();
    const permission = Boolean(OneSignal.Notifications.permission);
    const optedIn = Boolean(OneSignal.User.PushSubscription.optedIn);
    const id = OneSignal.User.PushSubscription.id || null;
    const token = OneSignal.User.PushSubscription.token || null;
    const active = Boolean(supported && permission && optedIn && id && token);
    return { supported, permission, optedIn, id, token, active };
  }

  function setState(state) {
    const { supported, active, permission, optedIn, id } = state;
    button.hidden = false;
    button.classList.toggle("push-on", active);
    button.classList.toggle("push-off", !active);
    button.classList.toggle("push-unsupported", !supported);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute("aria-label", active ? "Desativar notificações" : "Ativar notificações");

    let title = active ? "Notificações ativadas" : "Notificações desativadas";
    if (supported && permission && optedIn && !id) title = "Finalizando inscrição das notificações";
    button.setAttribute("title", title);
    button.innerHTML = active ? bellOn : bellOff;
  }

  async function waitForSubscription(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const state = getPushState();
      if (state.active) return state;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return getPushState();
  }

  try {
    await OneSignal.init({
      appId: "3427bd6a-c26d-4012-aeb6-da914976847c",
      serviceWorkerPath: "/cronograma-biblico-2027/push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/cronograma-biblico-2027/push/onesignal/" },
      notifyButton: { enable: false },
      welcomeNotification: { disable: true },
      autoResubscribe: true,
      notificationClickHandlerMatch: "origin",
      notificationClickHandlerAction: "navigate"
    });
  } catch (error) {
    console.error("Falha ao iniciar notificações:", error);
    setState({ supported: false, active: false, permission: false, optedIn: false, id: null });
    button.addEventListener("click", () => {
      alert("As notificações não puderam ser iniciadas neste navegador. Atualize a página e tente novamente.");
    }, { once: true });
    return;
  }

  function updateButton() {
    const state = getPushState();
    setState(state);
    return state;
  }

  button.addEventListener("click", async () => {
    const initial = getPushState();

    if (!initial.supported) {
      alert("Este navegador não oferece suporte a notificações web. No iPhone, instale o site na Tela de Início e abra por lá.");
      return;
    }

    setBusy(true);

    try {
      if (initial.active) {
        await OneSignal.User.PushSubscription.optOut();
      } else {
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          alert("As notificações estão bloqueadas para este site. Abra as configurações do navegador/site e permita notificações; depois toque no sino novamente.");
          return;
        }

        if (!OneSignal.Notifications.permission) {
          await OneSignal.Notifications.requestPermission();
        }

        if (OneSignal.Notifications.permission) {
          await OneSignal.User.PushSubscription.optIn();
          const finalState = await waitForSubscription();
          if (!finalState.active) {
            console.warn("Permissão concedida, mas a assinatura push não foi criada.", finalState);
            alert("O celular permitiu notificações, mas o OneSignal ainda não registrou este aparelho. Toque no sino novamente após alguns segundos. Se continuar assim, precisamos revisar a configuração Web Push no OneSignal.");
          }
        }
      }
    } catch (error) {
      console.error("Falha ao alterar notificações:", error);
      alert("Não foi possível concluir a inscrição das notificações agora. Atualize a página e tente novamente.");
    } finally {
      setBusy(false);
      updateButton();
    }
  });

  OneSignal.Notifications.addEventListener("permissionChange", updateButton);
  OneSignal.User.PushSubscription.addEventListener("change", updateButton);
  updateButton();
});
