import { Logger } from 'bf6-portal-utils/logger/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';

import { getVectorString } from '../helpers/index.ts';

import {
    RuntimeSpawnCommonFxStats,
    RuntimeSpawnCommonSfxAssets,
    RuntimeSpawnCommonSfxNames,
    RuntimeSpawnCommonVfxAssets,
    RuntimeSpawnCommonVfxNames,
} from './generated/runtime-spawn-common-fx.ts';

export namespace FxShowcase {
    export type Mode = 'VFX' | 'SFX';

    export type InteractIds = {
        playStop: number;
        cyclePosition?: number;
    };
}

export class FxShowcase {
    private readonly _player: mod.Player;
    private readonly _interactIds: FxShowcase.InteractIds;

    private readonly _hud: Logger;

    private readonly _topLabel: Logger;
    private readonly _searchStatus: Logger;

    private readonly _searchToggleButton: UI.TextButton;
    private readonly _quickPlayStopButton: UI.TextButton;
    private readonly _searchContainer: UI.Container;

    private _searchOpen: boolean = false;
    private _searchQuery: string = '';
    private _searchMode: 'contains' | 'prefix' = 'contains';

    private _mode: FxShowcase.Mode;
    private _index: number = 0;

    private readonly _initialBasePosition: mod.Vector;
    private _basePosition: mod.Vector;
    private _positionIndex: number = 0;
    private _offsetStepIndex: number = 1;
    private _verticalOffset: number = 0;

    private _activeSpawned: mod.Object | mod.VFX | undefined;
    private _activePlayedSound: Sounds.PlayedSound | undefined;

    private _autoCycleIntervalId: number | undefined;
    private _autoCycleMs: number = 2500;

    private _autoStopTimeoutId: number | undefined;

    private static readonly _OFFSET_STEPS: number[] = [2, 5, 10, 20, 35, 60];
    private static readonly _MIN_X_WHEN_BASE_NEGATIVE: number = -17;

    public constructor(player: mod.Player, basePosition: mod.Vector, interactIds: FxShowcase.InteractIds) {
        this._player = player;
        this._initialBasePosition = basePosition;
        this._basePosition = basePosition;
        this._interactIds = interactIds;

        this._mode = RuntimeSpawnCommonFxStats.vfxCount > 0 ? 'VFX' : 'SFX';

        this._hud = new Logger(player, {
            staticRows: true,
            visible: true,
            anchor: mod.UIAnchor.BottomLeft,
            width: 700,
            height: 180,
            bgAlpha: 0.55,
        });

        this._topLabel = new Logger(player, {
            staticRows: true,
            visible: true,
            anchor: mod.UIAnchor.TopCenter,
            x: 0,
            y: 80,
            width: 900,
            height: 55,
            bgAlpha: 0.55,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
        });

        this._searchToggleButton = new UI.TextButton({
            x: 0,
            y: 140,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.open),
            textSize: 22,
            textColor: UI.COLORS.BF_BLUE_BRIGHT,
            onClick: async (): Promise<void> => {
                this._toggleSearchUi();
            },
            visible: true,
            receiver: player,
        });

        // Quick Play/Stop button.
        this._quickPlayStopButton = new UI.TextButton({
            x: 180,
            y: 140,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.playStop),
            textSize: 22,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            onClick: async (): Promise<void> => {
                this.togglePlayStopFromButton();
            },
            visible: true,
            receiver: player,
        });

        this._searchContainer = new UI.Container({
            x: 0,
            y: 175,
            width: 900,
            height: 460,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.55,
            bgFill: mod.UIBgFill.Blur,
            visible: false,
            receiver: player,
        });

        // Search status overlay inside the panel (shows what you've "typed" + current char + mode).
        // Use Logger so we can display arbitrary strings safely.
        this._searchStatus = new Logger(player, {
            staticRows: true,
            visible: false,
            parent: this._searchContainer,
            anchor: mod.UIAnchor.TopCenter,
            x: 0,
            y: 0,
            width: 900,
            height: 64,
            bgAlpha: 0.0,
            bgFill: mod.UIBgFill.None,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
        });

        // Control row A: Back/Clear + horizontal offset controls.
        void new UI.TextButton({
            parent: this._searchContainer,
            x: 10,
            y: 68,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.back),
            textSize: 20,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
            onClick: async (): Promise<void> => {
                this._searchQuery = this._searchQuery.slice(0, Math.max(0, this._searchQuery.length - 1));
                this._refreshSearchUi();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 180,
            y: 68,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.clear),
            textSize: 20,
            textColor: UI.COLORS.BF_RED_BRIGHT,
            onClick: async (): Promise<void> => {
                this._searchQuery = '';
                this._refreshSearchUi();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 350,
            y: 68,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.offsetMinus),
            textSize: 20,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
            onClick: async (): Promise<void> => {
                this.offsetMinus();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 520,
            y: 68,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.offsetPlus),
            textSize: 20,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
            onClick: async (): Promise<void> => {
                this.offsetPlus();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 690,
            y: 68,
            width: 200,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.pos),
            textSize: 20,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
            onClick: async (): Promise<void> => {
                this.cyclePosition();
            },
            receiver: player,
        });

        // Control row C: Vertical offset controls (height).
        void new UI.TextButton({
            parent: this._searchContainer,
            x: 10,
            y: 152,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.heightMinus),
            textSize: 20,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
            onClick: async (): Promise<void> => {
                this.heightMinus();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 180,
            y: 152,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.heightPlus),
            textSize: 20,
            textColor: UI.COLORS.BF_YELLOW_BRIGHT,
            onClick: async (): Promise<void> => {
                this.heightPlus();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 350,
            y: 152,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.heightReset),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            onClick: async (): Promise<void> => {
                this.heightReset();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 520,
            y: 152,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.resetPosition),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            onClick: async (): Promise<void> => {
                this.resetPositionAndOffsets();
            },
            receiver: player,
        });

        // Control row B: Match navigation + mode + VFX/SFX + play/stop.
        void new UI.TextButton({
            parent: this._searchContainer,
            x: 10,
            y: 110,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.matchPrev),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            onClick: async (): Promise<void> => {
                this._seekMatch(-1);
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 180,
            y: 110,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.matchNext),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            onClick: async (): Promise<void> => {
                this._seekMatch(1);
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 350,
            y: 110,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.toggleMode),
            textSize: 20,
            textColor: UI.COLORS.BF_BLUE_BRIGHT,
            onClick: async (): Promise<void> => {
                this._toggleSearchMode();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 520,
            y: 110,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.fxMode),
            textSize: 20,
            textColor: UI.COLORS.BF_BLUE_BRIGHT,
            onClick: async (): Promise<void> => {
                this.toggleMode();
            },
            receiver: player,
        });

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 690,
            y: 110,
            width: 200,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.playStop),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            onClick: async (): Promise<void> => {
                this.togglePlayStop();
            },
            receiver: player,
        });

        // (offset/pos controls moved to row A)

        void new UI.TextButton({
            parent: this._searchContainer,
            x: 730,
            y: 10,
            width: 160,
            height: 34,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.fxShowcase.search.close),
            textSize: 20,
            textColor: UI.COLORS.WHITE,
            onClick: async (): Promise<void> => {
                this._toggleSearchUi(false);
            },
            receiver: player,
        });

        // Virtual keyboard.
        const keyW = 55;
        const keyH = 32;
        const gap = 6;

        const addKey = (charToAdd: string, label: mod.Message, x: number, y: number, width: number = keyW): void => {
            void new UI.TextButton({
                parent: this._searchContainer,
                x,
                y,
                width,
                height: keyH,
                anchor: mod.UIAnchor.TopLeft,
                bgColor: UI.COLORS.GREY_25,
                baseColor: UI.COLORS.BLACK,
                message: label,
                textSize: 18,
                textColor: UI.COLORS.WHITE,
                onClick: async (): Promise<void> => {
                    this._searchQuery += charToAdd;
                    this._refreshSearchUi();
                },
                receiver: player,
            });
        };

        // Leave room for the control rows above.
        const y0 = 196;

        const row1 = 'QWERTYUIOP';
        const row2 = 'ASDFGHJKL';
        const row3 = 'ZXCVBNM';
        const row4 = '0123456789';

        const rowWidth = (n: number): number => n * keyW + (n - 1) * gap;
        const startX = (n: number): number => Math.floor((900 - rowWidth(n)) / 2);

        // Letters row 1
        for (let i = 0; i < row1.length; i++) {
            const ch = row1[i];
            addKey(ch, mod.Message(mod.stringkeys.logger.chars[ch]), startX(row1.length) + i * (keyW + gap), y0);
        }

        // Letters row 2
        for (let i = 0; i < row2.length; i++) {
            const ch = row2[i];
            addKey(
                ch,
                mod.Message(mod.stringkeys.logger.chars[ch]),
                startX(row2.length) + i * (keyW + gap),
                y0 + (keyH + gap)
            );
        }

        // Letters row 3
        for (let i = 0; i < row3.length; i++) {
            const ch = row3[i];
            addKey(
                ch,
                mod.Message(mod.stringkeys.logger.chars[ch]),
                startX(row3.length) + i * (keyW + gap),
                y0 + 2 * (keyH + gap)
            );
        }

        // Digits row
        for (let i = 0; i < row4.length; i++) {
            const ch = row4[i];
            addKey(
                ch,
                mod.Message(mod.stringkeys.logger.chars[ch]),
                startX(row4.length) + i * (keyW + gap),
                y0 + 3 * (keyH + gap)
            );
        }

        // Bottom row: FX_/SFX_ shortcuts + '_' + '-' + Space (wide)
        const macroW = keyW * 2 + gap;
        const spaceW = keyW * 3 + gap * 2;
        const bottomCountWidth = macroW + gap + macroW + gap + keyW + gap + keyW + gap + spaceW;
        let bx = Math.floor((900 - bottomCountWidth) / 2);
        const by = y0 + 4 * (keyH + gap);

        addKey('FX_', mod.Message(mod.stringkeys.fxShowcase.search.fxPrefix), bx, by, macroW);
        bx += macroW + gap;
        addKey('SFX_', mod.Message(mod.stringkeys.fxShowcase.search.sfxPrefix), bx, by, macroW);
        bx += macroW + gap;
        addKey('_', mod.Message(mod.stringkeys.logger.chars['_']), bx, by);
        bx += keyW + gap;
        addKey('-', mod.Message(mod.stringkeys.logger.chars['-']), bx, by);
        bx += keyW + gap;
        addKey(' ', mod.Message(mod.stringkeys.fxShowcase.search.space), bx, by, spaceW);

        // Back/Clear are in control row A.

        // Keep Sounds logging quiet unless you want to debug pooling.
        Sounds.setLogging((text) => this._hud.log(text, 10), Sounds.LogLevel.Error);

        this._refreshHud();
    }

    public openSearchUi(): void {
        this._toggleSearchUi(true);
    }

    public closeSearchUi(): void {
        this._toggleSearchUi(false);
    }

    private _toggleSearchUi(force?: boolean): void {
        const next = force !== undefined ? force : !this._searchOpen;
        this._searchOpen = next;

        if (this._searchOpen) {
            this._searchToggleButton.setMessage(mod.Message(mod.stringkeys.fxShowcase.search.close));
            this._searchContainer.show();
            this._searchStatus.show();
            mod.EnableUIInputMode(true);
        } else {
            this._searchToggleButton.setMessage(mod.Message(mod.stringkeys.fxShowcase.search.open));
            this._searchContainer.hide();
            this._searchStatus.hide();
            mod.EnableUIInputMode(false);
        }

        this._refreshSearchUi();
    }

    private _toggleSearchMode(): void {
        this._searchMode = this._searchMode === 'contains' ? 'prefix' : 'contains';
        this._refreshSearchUi();
    }

    private _refreshSearchUi(): void {
        // Dynamic search text is displayed via Logger in _refreshHud().
        // Ensure the overlay updates on every edit.
        this._refreshHud();
    }

    private _seekMatch(direction: 1 | -1): void {
        if (this._searchQuery.length === 0) {
            if (direction === 1) this.next();
            else this.prev();
            return;
        }

        const names = this._mode === 'VFX' ? RuntimeSpawnCommonVfxNames : RuntimeSpawnCommonSfxNames;
        const count = this._countForMode();
        const needle = this._searchQuery.toLowerCase();

        // Start searching after the current index (so Next doesn't keep selecting the same).
        let i = this._index;
        for (let step = 0; step < count; step++) {
            i = (i + direction + count) % count;

            const name = (names[i] ?? '').toLowerCase();
            const ok = this._searchMode === 'contains' ? name.indexOf(needle) >= 0 : name.indexOf(needle) === 0;

            if (!ok) continue;

            this.stop();
            this._index = i;
            this._refreshHud();
            return;
        }

        this._hud.log(`Search: no match for '${this._searchQuery}'`, 9);
    }

    public setBasePosition(position: mod.Vector): void {
        this._basePosition = position;
        this._refreshHud();
    }

    public handleInteract(interactPointId: number): void {
        if (interactPointId === this._interactIds.playStop) {
            this.togglePlayStop();
            return;
        }

        if (this._interactIds.cyclePosition !== undefined && interactPointId === this._interactIds.cyclePosition) {
            this.cyclePosition();
            return;
        }
    }

    public toggleMode(): void {
        this.stop();

        this._mode = this._mode === 'VFX' ? 'SFX' : 'VFX';
        this._index = 0;

        this._refreshHud();
    }

    public cyclePosition(): void {
        this._positionIndex = (this._positionIndex + 1) % 3;

        this._moveActiveToCurrentPosition();

        this._refreshHud();
    }

    public offsetMinus(): void {
        if (this._positionIndex === 0) this._positionIndex = 2;
        this._offsetStepIndex = Math.max(0, this._offsetStepIndex - 1);
        this._moveActiveToCurrentPosition();
        this._refreshHud();
    }

    public offsetPlus(): void {
        if (this._positionIndex === 0) this._positionIndex = 1;
        this._offsetStepIndex = Math.min(FxShowcase._OFFSET_STEPS.length - 1, this._offsetStepIndex + 1);
        this._moveActiveToCurrentPosition();
        this._refreshHud();
    }

    public heightMinus(): void {
        const step = FxShowcase._OFFSET_STEPS[this._offsetStepIndex] ?? 5;
        this._verticalOffset -= step;
        this._moveActiveToCurrentPosition();
        this._refreshHud();
    }

    public heightPlus(): void {
        const step = FxShowcase._OFFSET_STEPS[this._offsetStepIndex] ?? 5;
        this._verticalOffset += step;
        this._moveActiveToCurrentPosition();
        this._refreshHud();
    }

    public heightReset(): void {
        this._verticalOffset = 0;
        this._moveActiveToCurrentPosition();
        this._refreshHud();
    }

    public resetPositionAndOffsets(): void {
        this._basePosition = this._initialBasePosition;
        this._positionIndex = 0;
        this._offsetStepIndex = 1;
        this._verticalOffset = 0;

        this._moveActiveToCurrentPosition();
        this._refreshHud();
    }

    public next(): void {
        this.stop();

        this._index = (this._index + 1) % this._countForMode();
        this._refreshHud();
    }

    public prev(): void {
        this.stop();

        this._index = (this._index - 1 + this._countForMode()) % this._countForMode();
        this._refreshHud();
    }

    public togglePlayStop(): void {
        if (this._isPlaying()) {
            this.stop();
        } else {
            this.play();
        }

        this._refreshHud();
    }

    public togglePlayStopFromInteract(): void {
        if (this._isPlaying()) {
            this._stopCore();
            return;
        }

        this._playCore();
    }

    public togglePlayStopFromButton(): void {
        if (this._isPlaying()) {
            this._stopCore();
            return;
        }

        this._playCore();
    }

    public play(): void {
        this._stopCore();
        this._playCore();
        this._refreshHud();
    }

    public stop(): void {
        this._stopCore();
        this._refreshHud();
    }

    private _playCore(): void {
        const position = this._currentPosition();
        const rotation = mod.CreateVector(0, 0, 0);

        if (this._mode === 'VFX') {
            const asset = RuntimeSpawnCommonVfxAssets[this._index];

            // SpawnObject returns Any; for FX_* assets it may return a VFX handle OR an Object.
            const spawned = mod.SpawnObject(asset, position, rotation) as unknown;

            if (mod.IsType(spawned, mod.Types.VFX)) {
                const vfx = spawned as mod.VFX;
                this._activeSpawned = vfx;

                mod.EnableVFX(vfx, true);

                // TODO: Add scale/speed controls to UI
                // Set the default scale/speed on a new spawn
                mod.SetVFXScale(vfx, 1);
                mod.SetVFXSpeed(vfx, 1);
            } else if (mod.IsType(spawned, mod.Types.Object)) {
                this._activeSpawned = spawned as mod.Object;
            } else {
                this._activeSpawned = undefined;
            }

            // Auto-stop after a short time so the map doesn't accumulate enabled VFX.
            this._autoStopTimeoutId = Timers.setTimeout(() => {
                this._stopCore();
            }, 6000);

            return;
        }

        const sfxAsset = RuntimeSpawnCommonSfxAssets[this._index];
        const sfxName = RuntimeSpawnCommonSfxNames[this._index] ?? 'SFX_Unknown';
        // Native-looping SFX usually include "Loop" in their name. We still want them capped,
        // just with a longer preview window.
        const isNativeLoop = /Loop/i.test(sfxName);
        const durationMs = isNativeLoop ? 8000 : 4500;

        this._activePlayedSound = Sounds.play3D(sfxAsset, position, {
            amplitude: 1.25,
            attenuationRange: 90,
            duration: durationMs,
        });

        // Ensure we flip back to "stopped" state when the sound ends.
        this._autoStopTimeoutId = Timers.setTimeout(() => {
            this._stopCore();
        }, durationMs + 200);
    }

    private _stopCore(): void {
        Timers.clearTimeout(this._autoStopTimeoutId);
        this._autoStopTimeoutId = undefined;

        if (this._activePlayedSound) {
            this._activePlayedSound.stop();
            this._activePlayedSound = undefined;
        }

        if (this._activeSpawned) {
            if (mod.IsType(this._activeSpawned, mod.Types.VFX)) {
                mod.EnableVFX(this._activeSpawned as mod.VFX, false);
            } else if (mod.IsType(this._activeSpawned, mod.Types.Object)) {
                mod.UnspawnObject(this._activeSpawned as mod.Object);
            }

            this._activeSpawned = undefined;
        }
    }

    private _isPlaying(): boolean {
        return !!this._activePlayedSound || !!this._activeSpawned;
    }

    private _countForMode(): number {
        return this._mode === 'VFX' ? RuntimeSpawnCommonVfxAssets.length : RuntimeSpawnCommonSfxAssets.length;
    }

    private _currentName(): string {
        return this._mode === 'VFX'
            ? (RuntimeSpawnCommonVfxNames[this._index] ?? 'VFX_Unknown')
            : (RuntimeSpawnCommonSfxNames[this._index] ?? 'SFX_Unknown');
    }

    private _currentPosition(): mod.Vector {
        const step = FxShowcase._OFFSET_STEPS[this._offsetStepIndex] ?? 5;
        const offsetX = this._positionIndex === 0 ? 0 : this._positionIndex === 1 ? step : -step;

        const base = this._basePosition;
        const baseX = mod.XComponentOf(base);
        const baseY = mod.YComponentOf(base);
        const baseZ = mod.ZComponentOf(base);

        
        let x = baseX + offsetX;

        // Map-specific safety: if the base position lives on the negative side already,
        // don't allow the effect to move closer than the configured X limit.
        if (baseX <= FxShowcase._MIN_X_WHEN_BASE_NEGATIVE && x > FxShowcase._MIN_X_WHEN_BASE_NEGATIVE) {
            x = FxShowcase._MIN_X_WHEN_BASE_NEGATIVE;
        }

        return mod.CreateVector(x, baseY + this._verticalOffset, baseZ);

    }

    private _moveActiveToCurrentPosition(): void {
        if (this._activeSpawned && mod.IsType(this._activeSpawned, mod.Types.VFX)) {
            mod.MoveVFX(this._activeSpawned as mod.VFX, this._currentPosition(), mod.CreateVector(0, 0, 0));
            return;
        }

        if (this._activeSpawned && mod.IsType(this._activeSpawned, mod.Types.Object)) {
            const target = this._currentPosition();
            const obj = this._activeSpawned as mod.Object;
            const current = mod.GetObjectPosition(obj);
            mod.MoveObject(obj, mod.Subtract(target, current));
        }
    }

    private _offsetXStr(): string {
        const step = FxShowcase._OFFSET_STEPS[this._offsetStepIndex] ?? 5;
        if (this._positionIndex === 0) return `0 (step=${step})`;
        return `${this._positionIndex === 1 ? '+' : '-'}${step}`;
    }

    private _offsetYStr(): string {
        const step = FxShowcase._OFFSET_STEPS[this._offsetStepIndex] ?? 5;
        if (this._verticalOffset === 0) return `0 (step=${step})`;
        return `${this._verticalOffset > 0 ? '+' : ''}${this._verticalOffset} (step=${step})`;
    }

    private _refreshHud(): void {
        const isAdmin = mod.GetObjId(this._player) === 0;

        this._topLabel.log(
            `Prepared: ${this._currentName()} (${this._mode} ${this._index + 1}/${this._countForMode()})`,
            0
        );

        this._hud.log(`FX Showcase (admin=${isAdmin})`, 0);
        this._hud.log(`Mode: ${this._mode}  Index: ${this._index + 1}/${this._countForMode()}`, 1);
        this._hud.log(`Base: ${getVectorString(this._basePosition)}`, 2);
        this._hud.log(
            `OffsetX: ${this._offsetXStr()}  OffsetY: ${this._offsetYStr()}   Spawn: ${getVectorString(this._currentPosition())}`,
            3
        );
        this._hud.log(
            `State: ${this._isPlaying() ? 'PLAYING' : 'STOPPED'}  Auto-cycle: ${this._autoCycleIntervalId !== undefined ? 'ON' : 'OFF'}`,
            4
        );

        this._hud.log(`Search: ${this._searchQuery.length > 0 ? this._searchQuery : '-'} (${this._searchMode})`, 7);
        this._hud.log(`Search UI: ${this._searchOpen ? 'OPEN' : 'CLOSED'}`, 8);

        if (this._searchOpen) {
            const query = this._searchQuery.length > 0 ? this._searchQuery : '-';
            const mode = this._searchMode;
            this._searchStatus.log(`Search query: ${query}`, 0);
            this._searchStatus.log(`Mode: ${mode}`, 1);
            this._searchStatus.log(
                `OffsetX: ${this._offsetXStr()}  OffsetY: ${this._offsetYStr()}   Pos slot: ${this._positionIndex + 1}/3 | Tap keys | Back/Clear | Match +/-`,
                2
            );
        }

        this._hud.log(
            `Interact IDs: play=${this._interactIds.playStop} pos=${this._interactIds.cyclePosition ?? -1}`,
            6
        );
    }
}
