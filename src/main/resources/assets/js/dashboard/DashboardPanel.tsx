import {Skeleton} from '@enonic/ui';
import {useEffect, useState} from 'preact/hooks';
import type {DashboardConfig} from '../shared/config';
import {i18n} from '../shared/i18n';
import {WidgetCard} from './WidgetCard';
import {fetchWidgets, type DashboardWidget} from './widgets';

interface DashboardPanelProps {
    config: DashboardConfig;
    generation: number;
}

export const DashboardPanel = ({config, generation}: DashboardPanelProps) => {
    const [loaded, setLoaded] = useState<{widgets: DashboardWidget[]; generation: number} | null>(null);
    const widgets = loaded?.widgets;

    useEffect(() => {
        let active = true;
        fetchWidgets(config.extensionApiUrl)
            .then(fresh => {
                if (active) {
                    setLoaded({widgets: fresh, generation});
                }
            })
            .catch(e => {
                console.error('Failed to fetch the dashboard widgets:', e);
                if (active) {
                    setLoaded(current => current ?? {widgets: [], generation});
                }
            });
        return () => {
            active = false;
        };
    }, [config.extensionApiUrl, generation]);

    return (
        <div className="dashboard-widget-panel relative flex h-full w-full items-stretch bg-surface-primary">
            <aside className="dashboard-sidebar flex w-15 shrink-0 flex-col items-center bg-surface-neutral py-[15px] text-main">
                <div className="dashboard-sidebar-logo flex items-center justify-center [&_svg]:block [&_svg]:size-7" dangerouslySetInnerHTML={{__html: config.dashboardIcon ?? ''}}/>
                <span className="dashboard-sidebar-title mt-4 text-base font-semibold whitespace-nowrap [writing-mode:vertical-rl]">{i18n('home.dashboard')}</span>
            </aside>
            <div className="dashboard-widgets-grid min-w-0 flex-1 px-2.5 py-12.5">
                {widgets === undefined && (
                    <Skeleton.Group className="extension-placeholder width-medium height-medium flex flex-col gap-2 p-5" aria-busy="true">
                        <Skeleton shape="rectangle" size="lg" className="w-64"/>
                        <Skeleton shape="rectangle" size="md"/>
                        <Skeleton shape="rectangle" size="md" className="w-80"/>
                    </Skeleton.Group>
                )}
                {widgets?.length === 0 && (
                    <div className="dashboard-empty-state flex h-full w-full items-center justify-center text-center text-sm tracking-wide text-subtle">
                        {i18n('home.dashboard.noWidgets')}
                    </div>
                )}
                {widgets?.map(widget => <WidgetCard key={`${widget.key}:${loaded?.generation}`} widget={widget}/>)}
            </div>
        </div>
    );
};
