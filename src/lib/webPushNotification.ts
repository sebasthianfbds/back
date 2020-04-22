import webpush from "web-push";
const PUBLIC_VAPID =
  "BDx9P20VhKgshsm7SkdpQ9odpOL1z2XYaGpyfXA58_4W_8yV87D2QKbCGuj2OQ3V2B_HWVEDIm3vT9vxScHuil4";
const PRIVATE_VAPID = "Jy9KNnU4AlxwZ7JQfKUx0nN0DBx7O9Ij_0Vs1QmIItM";

webpush.setVapidDetails("mailto:you@domain.com", PUBLIC_VAPID, PRIVATE_VAPID);

export function webPushNotify(
  subscription: any,
  notification: { title?: string; message: string; icon?: string },
  action?: string
) {
  const notificationPayload = {
    notification: {
      data: action,
      title: notification.title || "Nova notificação",
      body: notification.message,
      icon: notification.icon || "assets/icons/icon-512x512.png",
    },
  };
  webpush
    .sendNotification(subscription, JSON.stringify(notificationPayload))
    .then();
}
