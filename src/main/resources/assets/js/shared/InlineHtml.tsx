import type {JSX} from 'preact';
import {useLayoutEffect, useRef} from 'preact/hooks';
import {importHtml} from './inline-styles';

type InlineHtmlProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> & {html?: string | null};

export const InlineHtml = ({html, ...props}: InlineHtmlProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const element = ref.current;
        element.replaceChildren();
        importHtml(html ?? '', element);
    }, [html]);

    return <div {...props} ref={ref}/>;
};
