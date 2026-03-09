import {Extension, ExtensionConfig, ExtensionBuilder} from '@enonic/lib-admin-ui/extension/Extension';
import {ExtensionDescriptorJson} from '@enonic/lib-admin-ui/extension/ExtensionDescriptorJson';

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

export class DashboardExtension extends Extension<DashboardExtensionBuilder, DashboardExtensionConfig> {
    protected createConfig(): DashboardExtensionConfig {
        return new DashboardExtensionConfig();
    }

    static fromJson(json: ExtensionDescriptorJson): DashboardExtension {
        return new DashboardExtensionBuilder().fromJson(json).build();
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

class DashboardExtensionConfig extends ExtensionConfig {
    private width: WidgetSize;
    private height: WidgetSize;
    private style: WidgetStyle;
    private order: number;
    private header: boolean;

    fromJson(json: Record<string, string>): DashboardExtensionConfig {
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

class DashboardExtensionBuilder extends ExtensionBuilder<DashboardExtensionConfig> {
    fromJson(json: ExtensionDescriptorJson): DashboardExtensionBuilder {
        super.fromJson(json);

        return this;
    }

    protected createConfig(json: Record<string, string>): DashboardExtensionConfig {
        return new DashboardExtensionConfig().fromJson(json);
    }

    build(): DashboardExtension {
        return new DashboardExtension(this);
    }
}

