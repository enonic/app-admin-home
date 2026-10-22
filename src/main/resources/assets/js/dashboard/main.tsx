import {h, render} from 'preact';
import {readConfig} from '../shared/config';
import {setPhrases} from '../shared/i18n';
import {App} from './App';

const container = document.getElementById('home-main-container');
if (container) {
    try {
        const config = readConfig();
        setPhrases(config.phrases);
        render(h(App, {config}), container);
    } catch (e) {
        console.error('Failed to start the dashboard:', e);
    }
}
