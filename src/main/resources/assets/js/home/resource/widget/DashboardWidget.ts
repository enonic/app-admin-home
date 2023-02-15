import {Widget, WidgetConfig, WidgetBuilder} from '@enonic/lib-admin-ui/content/Widget';
import {WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';

enum WidgetSize {
    AUTO = 'auto',
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
    FULL = 'full'
}

enum WidgetStyle {
    AUTO = '',
    CUSTOM = 'custom'
}

class DashboardWidgetConfig extends WidgetConfig {
    private width: WidgetSize;
    private height: WidgetSize;
    private style: WidgetStyle;
    private order: number;
    private header: boolean;

    fromJson(json: { [key: string]: string }): DashboardWidgetConfig {
        this.width = <WidgetSize>WidgetSize[json.width?.toUpperCase()] || WidgetSize.MEDIUM;
        this.height = <WidgetSize>WidgetSize[json.height?.toUpperCase()] || WidgetSize.MEDIUM;
        this.style = <WidgetStyle>WidgetStyle[json.style?.toUpperCase()] || WidgetStyle.AUTO;
        this.order = Number.isNaN(json.order) ? Number.MAX_VALUE : parseInt(json.order);
        this.header = json.header !== 'false';

        return this;
    }

    getHeight(): string {
        return this.height;
    }

    getWidth(): string {
        return this.width;
    }

    getStyle(): string {
        return this.style || '';
    }

    getOrder(): number {
        return this.order;
    }

    hasHeader(): boolean {
        return this.header;
    }
}

class DashboardWidgetBuilder extends WidgetBuilder {
    config: DashboardWidgetConfig;

    fromJson(json: WidgetDescriptorJson): WidgetBuilder {
        const builder = super.fromJson(json);

        builder.config = new DashboardWidgetConfig().fromJson(json.config);

        return this;
    }

    /* eslint-disable @typescript-eslint/no-use-before-define */
    build(): DashboardWidget {
        return new DashboardWidget(this);
    }
}

export class DashboardWidget extends Widget {
    protected readonly config: DashboardWidgetConfig;

    static fromJson(json: WidgetDescriptorJson): DashboardWidget {
        return <DashboardWidget>new DashboardWidgetBuilder().fromJson(json).build();
    }

    public getConfig(): DashboardWidgetConfig {
        return this.config;
    }

    getHeight(): string {
        return this.config.getHeight();
    }

    getWidth(): string {
        return this.config.getWidth();
    }

    getStyle(): string {
        return this.config.getStyle();
    }

    getOrder(): number {
        return this.config.getOrder();
    }

    hasCustomStyling(): boolean {
        return this.config.getStyle() !== WidgetStyle.AUTO;
    }

    hasHeader(): boolean {
        return this.config.hasHeader();
    }
}
