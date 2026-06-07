// Web Alert polyfill — React Native Web 不支持三参数 Alert.alert
if (typeof window !== "undefined" && typeof window.confirm !== "undefined") {
  const origAlert = (globalThis as any).alert;
  (globalThis as any)._rnAlert = (title: string, message?: string, buttons?: any[]) => {
    if (!buttons || buttons.length <= 1) {
      window.alert(`${title}\n${message || ""}`);
      const ok = buttons?.[0];
      ok?.onPress?.();
      return;
    }
    const labels = buttons.map((b: any) => b.text).join(" / ");
    const result = window.confirm(`${title}\n\n${message || ""}\n\n选择: ${labels}`);
    if (result) {
      const ok = buttons.find((b: any) => b.style !== "cancel") || buttons[buttons.length - 1];
      ok?.onPress?.();
    } else {
      const cancel = buttons.find((b: any) => b.style === "cancel") || buttons[0];
      cancel?.onPress?.();
    }
  };
}
