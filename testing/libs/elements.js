/**
 * Created  on 07.09.2017.
 */

module.exports = Object.freeze({
    NAMES_VIEW_BY_NAME: "//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'%s')]]",
    NAMES_VIEW_BY_DISPLAY_NAME: "//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'%s')]]",
    SLICK_ROW: "//div[@class='slick-viewport']//div[contains(@class,'slick-row')]",
    SLICK_ROW_BY_NAME: "//div[@class='slick-viewport']//div[contains(@class,'slick-row') and descendant::p[contains(@class,'sub-name') and contains(.,'%s')]]",
    H6_DISPLAY_NAME: "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
    TEXT_INPUT: "//input[contains(@id,'TextInput')]",
    DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
    slickRowByDisplayName: function (displayName) {
        return `//div[@class='slick-viewport']//div[contains(@class,'slick-row') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    itemByDisplayName: function (displayName) {
        return `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    itemByName: function (name) {
        return ` //div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    tabItemByDisplayName: function (displayName) {
        return `//li[contains(@id,'AppBarTabMenuItem') and descendant::a[contains(.,'${displayName}')]]`
    },
    CANCEL_BUTTON_TOP: `//div[@class='cancel-button-top']`,

    COMBO_BOX_OPTION_FILTER_INPUT: "//input[contains(@id,'ComboBoxOptionFilterInput')]",

    PRINCIPAL_SELECTED_OPTION: `//div[contains(@id,'security.PrincipalSelectedOptionView')]`,

    selectedPrincipalByDisplayName: function (displayName) {
        return `//div[contains(@id,'PrincipalSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    },
    REMOVE_ICON: `//a[@class='remove']`,
});