import {Toast} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {$notifications, dismiss} from './notifications';

export const NotificationList = () => {
    const notifications = useStore($notifications);

    return (
        <div className="pointer-events-none fixed right-0 bottom-0 z-60 w-full px-2 pb-2 sm:right-9 sm:bottom-6 sm:max-w-115 sm:p-0" role="region">
            <div className="flex flex-col items-center gap-2.5">
                {notifications.map(({id, tone, text, actions}) => (
                    <div key={id} className="pointer-events-auto w-full">
                        <Toast open withClose role="status" onOpenChange={(open: boolean) => !open && dismiss(id)}>
                            <Toast.Icon tone={tone}/>
                            <Toast.Description>{text}</Toast.Description>
                            {actions.map(({label, onClick}) => (
                                <Toast.Button key={label} label={label} onClick={onClick}/>
                            ))}
                        </Toast>
                    </div>
                ))}
            </div>
        </div>
    );
};
