import _ from 'underscore';
import React, {memo} from 'react';
import PropTypes from 'prop-types';
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native';
import styles, {getBackgroundAndBorderStyle, getBackgroundColorStyle} from '../../../styles/styles';
import {optionPropTypes} from './optionPropTypes';
import Icon from '../../../components/Icon';
import {Pencil, Pin, Checkmark} from '../../../components/Icon/Expensicons';
import MultipleAvatars from '../../../components/MultipleAvatars';
import themeColors from '../../../styles/themes/default';
import Hoverable from '../../../components/Hoverable';
import DisplayNames from '../../../components/DisplayNames';
import IOUBadge from '../../../components/IOUBadge';
import colors from '../../../styles/colors';

const propTypes = {
    // Background Color of the Option Row
    backgroundColor: PropTypes.string,

    // Style for hovered state
    // eslint-disable-next-line react/forbid-prop-types
    hoverStyle: PropTypes.object,

    // Option to allow the user to choose from can be type 'report' or 'user'
    option: optionPropTypes.isRequired,

    // Whether this option is currently in focus so we can modify its style
    optionIsFocused: PropTypes.bool.isRequired,

    // A function that is called when an option is selected. Selected option is passed as a param
    onSelectRow: PropTypes.func,

    // A flag to indicate whether to show additional optional states, such as pin and draft icons
    hideAdditionalOptionStates: PropTypes.bool,

    // Whether we should show the selected state
    showSelectedState: PropTypes.bool,

    // Whether this item is selected
    isSelected: PropTypes.bool,

    // Force the text style to be the unread style
    forceTextUnreadStyle: PropTypes.bool,

    // Whether to show the title tooltip
    showTitleTooltip: PropTypes.bool,

    // Toggle between compact and default view
    mode: PropTypes.oneOf(['compact', 'default']),
};

const defaultProps = {
    backgroundColor: colors.white,
    hoverStyle: styles.sidebarLinkHover,
    hideAdditionalOptionStates: false,
    showSelectedState: false,
    isSelected: false,
    forceTextUnreadStyle: false,
    showTitleTooltip: false,
    mode: 'default',
    onSelectRow: null,
};

const OptionRow = ({
    backgroundColor,
    hoverStyle,
    option,
    optionIsFocused,
    onSelectRow,
    hideAdditionalOptionStates,
    showSelectedState,
    isSelected,
    forceTextUnreadStyle,
    showTitleTooltip,
    mode,
}) => {
    const textStyle = optionIsFocused
        ? styles.sidebarLinkActiveText
        : styles.sidebarLinkText;
    const textUnreadStyle = (option.isUnread || forceTextUnreadStyle)
        ? [textStyle, styles.sidebarLinkTextUnread] : [textStyle];
    const displayNameStyle = mode === 'compact'
        ? [styles.optionDisplayName, textUnreadStyle, styles.optionDisplayNameCompact, styles.mr2]
        : [styles.optionDisplayName, textUnreadStyle];
    const alternateTextStyle = mode === 'compact'
        ? [textStyle, styles.optionAlternateText, styles.optionAlternateTextCompact]
        : [textStyle, styles.optionAlternateText, styles.mt1];
    const contentContainerStyles = mode === 'compact'
        ? [styles.flex1, styles.flexRow, styles.overflowHidden, styles.alignItemsCenter]
        : [styles.flex1];
    const sidebarInnerRowStyle = StyleSheet.flatten(mode === 'compact' ? [
        styles.chatLinkRowPressable,
        styles.flexGrow1,
        styles.optionItemAvatarNameWrapper,
        styles.sidebarInnerRowSmall,
        styles.justifyContentCenter,
    ] : [
        styles.chatLinkRowPressable,
        styles.flexGrow1,
        styles.optionItemAvatarNameWrapper,
        styles.sidebarInnerRow,
        styles.justifyContentCenter,
    ]);
    const hoveredBackgroundColor = hoverStyle && hoverStyle.backgroundColor
        ? hoverStyle.backgroundColor
        : backgroundColor;
    const focusedBackgroundColor = styles.sidebarLinkActive.backgroundColor;
    const isMultipleParticipant = option.participantsList.length > 1;
    const displayNamesWithTooltips = _.map(
        option.participantsList,
        ({displayName, firstName, login}) => (
            {displayName: (isMultipleParticipant ? firstName : displayName) || login, tooltip: login}
        ),
    );
    const fullTitle = displayNamesWithTooltips.map(({displayName}) => displayName).join(', ');
    return (
        <Hoverable>
            {hovered => (
                <TouchableOpacity
                    onPress={() => onSelectRow(option)}
                    activeOpacity={0.8}
                    style={[
                        styles.flexRow,
                        styles.alignItemsCenter,
                        styles.justifyContentBetween,
                        styles.sidebarLink,
                        styles.sidebarLinkInner,
                        getBackgroundColorStyle(backgroundColor),
                        optionIsFocused ? styles.sidebarLinkActive : null,
                        hovered && !optionIsFocused ? hoverStyle : null,
                    ]}
                >
                    <View style={sidebarInnerRowStyle}>
                        <View
                            style={[
                                styles.flexRow,
                                styles.alignItemsCenter,
                            ]}
                        >
                            {
                                !_.isEmpty(option.icons)
                                && (
                                    <MultipleAvatars
                                        avatarImageURLs={option.icons}
                                        size={mode === 'compact' ? 'small' : 'default'}
                                        secondAvatarStyle={[
                                            getBackgroundAndBorderStyle(backgroundColor),
                                            optionIsFocused
                                                ? getBackgroundAndBorderStyle(focusedBackgroundColor)
                                                : undefined,
                                            hovered && !optionIsFocused
                                                ? getBackgroundAndBorderStyle(hoveredBackgroundColor)
                                                : undefined,
                                        ]}
                                    />
                                )
                            }
                            <View style={contentContainerStyles}>
                                <DisplayNames
                                    fullTitle={fullTitle}
                                    displayNamesWithTooltips={displayNamesWithTooltips}
                                    tooltipEnabled={showTitleTooltip}
                                    numberOfLines={1}
                                    textStyles={displayNameStyle}
                                />
                                {option.alternateText ? (
                                    <Text
                                        style={alternateTextStyle}
                                        numberOfLines={1}
                                    >
                                        {option.alternateText}
                                    </Text>
                                ) : null}
                            </View>
                            {option.descriptiveText ? (
                                <View style={[styles.flexWrap]}>
                                    <Text style={[styles.textLabel]}>
                                        {option.descriptiveText}
                                    </Text>
                                </View>
                            ) : null}
                            {showSelectedState && (
                                <View style={[styles.selectCircle]}>
                                    {isSelected && (
                                        <Icon src={Checkmark} fill={themeColors.iconSuccessFill} />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                    {!hideAdditionalOptionStates && (
                        <View style={[styles.flexRow, styles.alignItemsCenter]}>
                            {option.hasDraftComment && (
                                <View style={styles.ml2}>
                                    <Icon src={Pencil} height={16} width={16} />
                                </View>
                            )}
                            {option.hasOutstandingIOU && (
                                <IOUBadge iouReportID={option.iouReportID} />
                            )}
                            {option.isPinned && (
                                <View style={styles.ml2}>
                                    <Icon src={Pin} height={16} width={16} />
                                </View>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </Hoverable>
    );
};

OptionRow.propTypes = propTypes;
OptionRow.defaultProps = defaultProps;
OptionRow.displayName = 'OptionRow';

// It it very important to use React.memo here so SectionList items will not unnecessarily re-render
export default memo(OptionRow, (prevProps, nextProps) => {
    if (prevProps.optionIsFocused !== nextProps.optionIsFocused) {
        return false;
    }

    if (prevProps.isSelected !== nextProps.isSelected) {
        return false;
    }

    if (prevProps.mode !== nextProps.mode) {
        return false;
    }

    if (prevProps.option.isUnread !== nextProps.option.isUnread) {
        return false;
    }

    if (prevProps.option.alternateText !== nextProps.option.alternateText) {
        return false;
    }

    if (prevProps.option.descriptiveText !== nextProps.option.descriptiveText) {
        return false;
    }

    if (prevProps.option.hasDraftComment !== nextProps.option.hasDraftComment) {
        return false;
    }

    if (prevProps.option.isPinned !== nextProps.option.isPinned) {
        return false;
    }

    if (prevProps.option.hasOutstandingIOU !== nextProps.option.hasOutstandingIOU) {
        return false;
    }

    if (!_.isEqual(prevProps.option.icons, nextProps.option.icons)) {
        return false;
    }

    return true;
});
