import type {ToastTone} from '@enonic/ui';
import {atom} from 'nanostores';

export interface NotificationAction {
    label: string;
    onClick: () => void;
}

export interface Notification {
    id: number;
    tone: ToastTone;
    text: string;
    actions: NotificationAction[];
}

export const $notifications = atom<Notification[]>([]);

let lastId = 0;

export const notify = (tone: ToastTone, text: string, actions: NotificationAction[] = []): number => {
    lastId += 1;
    $notifications.set([...$notifications.get(), {id: lastId, tone, text, actions}]);
    return lastId;
};

export const dismiss = (id: number): void => {
    $notifications.set($notifications.get().filter(notification => notification.id !== id));
};
