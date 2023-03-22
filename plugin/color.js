const hx = require("hbuilderx");
function getThemeColor(area) {
    let config = hx.workspace.getConfiguration();
    let colorScheme = config.get('editor.colorScheme');
    let colorCustomizations = config.get('workbench.colorCustomizations');

    if (colorScheme == undefined) {
        colorScheme = 'Default';
    };

    // 背景颜色、输入框颜色、字体颜色、线条颜色
    let background, liHoverBackground,inputColor, inputLineColor, cursorColor, fontColor, lineColor, menuBackground;

    // 修复 0.1版本引出的Bug （当未定义自定义主题时异常的Bug）
    let custom = {};
    try{
        custom = colorCustomizations[`[${colorScheme}]`];
    }catch(e){
        custom = {}
    };

    let viewBackgroundOptionName = area == 'siderBar' ? 'sideBar.background' : 'editor.background';
    let viewFontOptionName = area == 'siderBar' ? 'list.foreground' : undefined;
    let viewLiHoverBgOptionName = area == 'siderBar' ? 'list.hoverBackground' : 'list.hoverBackground';

    if (colorScheme == 'Monokai') {
        if (custom != undefined && custom[viewBackgroundOptionName] && viewBackgroundOptionName in custom) {
            background = custom[viewBackgroundOptionName];
            menuBackground = custom[viewBackgroundOptionName];
        } else {
            background = 'rgb(39,40,34)';
            menuBackground = 'rgb(83,83,83)';
        };
        if (custom != undefined && custom[viewFontOptionName] && viewFontOptionName in custom) {
            fontColor = custom[viewFontOptionName];
        } else {
            fontColor = 'rgb(179,182,166)';
        };
        if (custom != undefined && custom[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in custom) {
            liHoverBackground = custom[viewLiHoverBgOptionName];
        } else {
            liHoverBackground = 'rgb(78,80,73)';
        };
        inputColor = 'rgb(255,254,250)';
        inputLineColor = 'rgb(210,210,210)';
        cursorColor = 'rgb(255,255,255)';
        lineColor = 'rgb(23,23,23)';
    } else if (colorScheme == 'Atom One Dark') {
        if (custom != undefined && custom[viewBackgroundOptionName] && viewBackgroundOptionName in custom) {
            background = custom[viewBackgroundOptionName];
            menuBackground = custom[viewBackgroundOptionName];
        } else {
            background = 'rgb(40,44,53)';
            menuBackground = 'rgb(50,56,66)';
        };
        if (custom != undefined && custom[viewFontOptionName] && viewFontOptionName in custom) {
            fontColor = custom[viewFontOptionName];
        } else {
            fontColor = 'rgb(171,178,191)';
        };
        if (custom != undefined && custom[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in custom) {
            liHoverBackground = custom[viewLiHoverBgOptionName];
        } else {
            liHoverBackground = 'rgb(44,47,55)';
        };
        inputColor = 'rgb(255,254,250)';
        inputLineColor = 'rgb(81,140,255)';
        cursorColor = 'rgb(255,255,255)';
        lineColor = 'rgb(33,37,43)';
    } else {
        if (custom != undefined && custom[viewBackgroundOptionName] && viewBackgroundOptionName in custom) {
            background = custom[viewBackgroundOptionName];
            menuBackground = custom[viewBackgroundOptionName];
        } else {
            background = 'rgb(255,250,232)';
            menuBackground = 'rgb(255,252,243)';
        };
        if (custom != undefined && custom[viewFontOptionName] && viewFontOptionName in custom) {
            fontColor = custom[viewFontOptionName];
        } else {
            fontColor = '#333';
        };
        if (custom != undefined && custom[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in custom) {
            liHoverBackground = custom[viewLiHoverBgOptionName];
        } else {
            liHoverBackground = 'rgb(224,237,211)';
        };
        inputColor = 'rgb(255,252,243)';
        inputLineColor = 'rgb(65,168,99)';
        cursorColor = 'rgb(0,0,0)';
        lineColor = 'rgb(225,212,178)';
    };

    return {
        background,
        menuBackground,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor
    };
};

module.exports = getThemeColor