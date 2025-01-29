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

export class DashboardWidget extends Widget<DashboardWidgetBuilder, DashboardWidgetConfig> {
    protected createConfig(): DashboardWidgetConfig {
        return new DashboardWidgetConfig();
    }

    static fromJson(json: WidgetDescriptorJson): DashboardWidget {
        return new DashboardWidgetBuilder().fromJson(json).build();
    }

    getHeight(): string {
        return this.getConfig().getHeight();
    }

    getWidth(): string {
        return this.getConfig().getWidth();
    }

    getStyle(): string {
        return this.getConfig().getStyle();
    }

    getOrder(): number {
        return this.getConfig().getOrder();
    }

    hasCustomStyling(): boolean {
        return this.getConfig().getStyle() !== WidgetStyle.AUTO.toString();
    }

    hasHeader(): boolean {
        return this.getConfig().hasHeader();
    }
}

class DashboardWidgetConfig extends WidgetConfig {
    private width: WidgetSize;
    private height: WidgetSize;
    private style: WidgetStyle;
    private order: number;
    private header: boolean;

    fromJson(json: Record<string, string>): DashboardWidgetConfig {
        this.width = WidgetSize[json.width?.toUpperCase()] as WidgetSize || WidgetSize.MEDIUM;
        this.height = WidgetSize[json.height?.toUpperCase()] as WidgetSize || WidgetSize.MEDIUM;
        this.style = WidgetStyle[json.style?.toUpperCase()] as WidgetStyle || WidgetStyle.AUTO;
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

class DashboardWidgetBuilder extends WidgetBuilder<DashboardWidgetConfig> {
    fromJson(json: WidgetDescriptorJson): DashboardWidgetBuilder {
        super.fromJson(json);

        return this;
    }

    protected createConfig(json: Record<string, string>): DashboardWidgetConfig {
        return new DashboardWidgetConfig().fromJson(json);
    }

    build(): DashboardWidget {
        return new DashboardWidget(this);
    }
}

