import {Skeleton} from '@enonic/ui';
import {useEffect, useRef, useState} from 'preact/hooks';
import {fetchWidgetHtml, type DashboardWidget} from './widgets';
import './widget-host';
import type {DashboardWidgetElement} from './widget-host';

type Status = 'loading' | 'loaded' | 'failed';

const cls = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ');

export const WidgetCard = ({widget}: {widget: DashboardWidget}) => {
    const hostRef = useRef<DashboardWidgetElement>(null);
    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        let active = true;
        setStatus('loading');
        fetchWidgetHtml(widget.url)
            .then(html => (active ? hostRef.current?.setHtml(html, () => active) : undefined))
            .then(() => {
                if (active) {
                    setStatus('loaded');
                }
            })
            .catch(e => {
                console.error(`Failed to load the widget ${widget.key}:`, e);
                if (active) {
                    setStatus('failed');
                }
            });
        return () => {
            active = false;
        };
    }, [widget.url]);

    return (
        <div
            className={cls('extension-placeholder flex flex-col overflow-hidden p-2.5', `width-${widget.width}`, `height-${widget.height}`, widget.custom && 'style-custom', status === 'loaded' && 'loaded')}
            data-widget={widget.key}
        >
            <div className={cls('extension-container flex h-full w-full flex-col', !widget.custom && 'rounded-[10px] bg-surface-neutral p-2.5')}>
                {widget.header && <h5 className="extension-header m-0 text-base text-main">{widget.title}</h5>}
                {status === 'loading' && (
                    <Skeleton.Group className="flex flex-1 flex-col gap-2 p-2.5" aria-busy="true">
                        <Skeleton shape="rectangle" size="md" className="w-3/4"/>
                        <Skeleton shape="rectangle" size="sm"/>
                        <Skeleton shape="rectangle" size="sm" className="w-1/2"/>
                    </Skeleton.Group>
                )}
                <dashboard-widget ref={hostRef} hidden={status !== 'loaded'}/>
            </div>
        </div>
    );
};
