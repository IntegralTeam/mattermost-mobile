// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {createSelector} from 'reselect';
import Fuse from 'fuse.js';

import {incrementEmojiPickerPage} from '@actions/views/emoji';
import {getCustomEmojis} from '@mm-redux/actions/emojis';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCustomEmojisByName} from '@mm-redux/selectors/entities/emojis';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {createIdsSelector} from '@mm-redux/utils/helpers';
import {getDimensions, isLandscape} from '@selectors/device';
import {BuiltInEmojis, CategoryNames, Emojis, EmojiIndicesByAlias, EmojiIndicesByCategory} from '@utils/emojis';
import {t} from '@utils/i18n';

import EmojiPicker from './emoji_picker';

const categoryToI18n = {
    activity: {
        id: t('mobile.emoji_picker.activity'),
        defaultMessage: 'ACTIVITY',
        icon: 'futbol-o',
    },
    custom: {
        id: t('mobile.emoji_picker.custom'),
        defaultMessage: 'CUSTOM',
        icon: 'at',
    },
    flags: {
        id: t('mobile.emoji_picker.flags'),
        defaultMessage: 'FLAGS',
        icon: 'flag-o',
    },
    foods: {
        id: t('mobile.emoji_picker.foods'),
        defaultMessage: 'FOODS',
        icon: 'cutlery',
    },
    nature: {
        id: t('mobile.emoji_picker.nature'),
        defaultMessage: 'NATURE',
        icon: 'leaf',
    },
    objects: {
        id: t('mobile.emoji_picker.objects'),
        defaultMessage: 'OBJECTS',
        icon: 'lightbulb-o',
    },
    people: {
        id: t('mobile.emoji_picker.people'),
        defaultMessage: 'PEOPLE',
        icon: 'smile-o',
    },
    places: {
        id: t('mobile.emoji_picker.places'),
        defaultMessage: 'PLACES',
        icon: 'plane',
    },
    recent: {
        id: t('mobile.emoji_picker.recent'),
        defaultMessage: 'RECENTLY USED',
        icon: 'clock-o',
    },
    symbols: {
        id: t('mobile.emoji_picker.symbols'),
        defaultMessage: 'SYMBOLS',
        icon: 'heart-o',
    },
};

function fillEmoji(indice) {
    const emoji = Emojis[indice];
    return {
        name: emoji.aliases[0],
        aliases: emoji.aliases,
    };
}

const getEmojisBySection = createSelector(
    getCustomEmojisByName,
    (state) => state.views.recentEmojis,
    (customEmojis, recentEmojis) => {
        const emoticons = CategoryNames.filter((name) => name !== 'custom').map((category) => {
            const items = EmojiIndicesByCategory.get(category).map(fillEmoji);

            const section = {
                ...categoryToI18n[category],
                key: category,
                data: items,
            };

            return section;
        });

        const customEmojiItems = [];
        BuiltInEmojis.forEach((emoji) => {
            customEmojiItems.push({
                name: emoji,
            });
        });

        for (const [key] of customEmojis) {
            customEmojiItems.push({
                name: key,
            });
        }

        emoticons.push({
            ...categoryToI18n.custom,
            key: 'custom',
            data: customEmojiItems,
        });

        if (recentEmojis.length) {
            const items = recentEmojis.map((emoji) => ({name: emoji}));

            emoticons.unshift({
                ...categoryToI18n.recent,
                key: 'recent',
                data: items,
            });
        }

        return emoticons;
    },
);

const getEmojisByName = createIdsSelector(
    getCustomEmojisByName,
    (customEmojis) => {
        const emoticons = new Set();
        for (const [key] of [...EmojiIndicesByAlias.entries(), ...customEmojis.entries()]) {
            emoticons.add(key);
        }

        return Array.from(emoticons);
    },
);

function mapStateToProps(state) {
    const emojisBySection = getEmojisBySection(state);
    const emojis = getEmojisByName(state);
    const {deviceWidth} = getDimensions(state);
    const options = {
        shouldSort: true,
        threshold: 0.3,
        location: 0,
        distance: 100,
        minMatchCharLength: 2,
        maxPatternLength: 32,
    };

    const list = emojis.length ? emojis : [];
    const fuse = new Fuse(list, options);

    return {
        fuse,
        emojis,
        emojisBySection,
        deviceWidth,
        isLandscape: isLandscape(state),
        theme: getTheme(state),
        customEmojisEnabled: getConfig(state).EnableCustomEmoji === 'true',
        customEmojiPage: state.views.emoji.emojiPickerCustomPage,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getCustomEmojis,
            incrementEmojiPickerPage,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EmojiPicker);
