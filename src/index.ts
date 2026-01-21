import { UI } from 'bf6-portal-utils/ui/index.ts';
import { InteractMultiClickDetector } from 'bf6-portal-utils/interact-multi-click-detector/index.ts';
import { MapDetector } from 'bf6-portal-utils/map-detector/index.ts';
import { FxShowcase } from './fx-showcase/index.ts';

import { DebugTool } from './debug-tool/index.ts';
import { getPlayerStateVectorString } from './helpers/index.ts';

let adminDebugTool: DebugTool | undefined;
let adminFxShowcase: FxShowcase | undefined;

// Deprecated, use debug UI instead
const INTERACT_PLAY = 1000
const INTERACT_POS = 1004


const FX_POSITION = [0.609, 32.253, -130.195]

// This will trigger every sever tick.
export function OngoingGlobal(): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.

    // Ensure the single-player controller (ObjId 0) is initialized even if join events are flaky.
    if (adminFxShowcase !== undefined) return;

    const players = mod.AllPlayers() as unknown as mod.Player[];
    for (const player of players) {
        if (mod.GetObjId(player) !== 0) continue;

        adminDebugTool = adminDebugTool ?? new DebugTool(player);
        adminFxShowcase = new FxShowcase(player, mod.CreateVector(FX_POSITION[0], FX_POSITION[1], FX_POSITION[2]), {
            playStop: INTERACT_PLAY,
            cyclePosition: INTERACT_POS,
        });
        return;
    }
}

// This will trigger every sever tick, for each AreaTrigger.
export function OngoingAreaTrigger(eventAreaTrigger: mod.AreaTrigger): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each CapturePoint.
export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each EmplacementSpawner.
export function OngoingEmplacementSpawner(eventEmplacementSpawner: mod.EmplacementSpawner): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each HQ.
export function OngoingHQ(eventHQ: mod.HQ): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each InteractPoint.
export function OngoingInteractPoint(eventInteractPoint: mod.InteractPoint): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each LootSpawner.
export function OngoingLootSpawner(eventLootSpawner: mod.LootSpawner): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each MCOM.
export function OngoingMCOM(eventMCOM: mod.MCOM): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each Player.
export function OngoingPlayer(eventPlayer: mod.Player): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.

    // Single-player map: player will always be ObjId 0.
    if (mod.GetObjId(eventPlayer) != 0) return;

    if (!InteractMultiClickDetector.checkMultiClick(eventPlayer)) return;

    // Triple-click now focuses the FX search UI instead of the debug menu.
    adminDebugTool?.hideDebugMenu();
    adminFxShowcase?.openSearchUi();
    mod.EnableUIInputMode(true);
}

// This will trigger every sever tick, for each RingOfFire.
export function OngoingRingOfFire(eventRingOfFire: mod.RingOfFire): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each Sector.
export function OngoingSector(eventSector: mod.Sector): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each Spawner.
export function OngoingSpawner(eventSpawner: mod.Spawner): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each SpawnPoint.
export function OngoingSpawnPoint(eventSpawnPoint: mod.SpawnPoint): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each Team.
export function OngoingTeam(eventTeam: mod.Team): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each Vehicle.
export function OngoingVehicle(eventVehicle: mod.Vehicle): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each VehicleSpawner.
export function OngoingVehicleSpawner(eventVehicleSpawner: mod.VehicleSpawner): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each WaypointPath.
export function OngoingWaypointPath(eventWaypointPath: mod.WaypointPath): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger every sever tick, for each WorldIcon.
export function OngoingWorldIcon(eventWorldIcon: mod.WorldIcon): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
}

// This will trigger when an AI Soldier stops trying to reach a destination.
export function OnAIMoveToFailed(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier starts moving to a target location.
export function OnAIMoveToRunning(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier reaches target location.
export function OnAIMoveToSucceeded(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier parachute action is running.
export function OnAIParachuteRunning(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier parachute action has succeeded.
export function OnAIParachuteSucceeded(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier stops following a waypoint.
export function OnAIWaypointIdleFailed(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier starts following a waypoint.
export function OnAIWaypointIdleRunning(eventPlayer: mod.Player): void {
}

// This will trigger when an AI Soldier finishes following a waypoint.
export function OnAIWaypointIdleSucceeded(eventPlayer: mod.Player): void {
}

// This will trigger when a team takes control of a CapturePoint.
export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
}

// This will trigger when a team begins capturing a CapturePoint.
export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint): void {
}

// This will trigger when a team loses control of a CapturePoint.
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
}

// This will trigger when the gamemode ends.
export function OnGameModeEnding(): void {
}

// This will trigger at the start of the gamemode.
export function OnGameModeStarted(): void {
}

// This will trigger when a Player is forced into the mandown state.
export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
}

// This will trigger when a MCOM is armed.
export function OnMCOMArmed(eventMCOM: mod.MCOM): void {
}

// This will trigger when a MCOM is defused.
export function OnMCOMDefused(eventMCOM: mod.MCOM): void {
}

// This will trigger when a MCOM detonates.
export function OnMCOMDestroyed(eventMCOM: mod.MCOM): void {
}

// This will trigger when a Player takes damage.
export function OnPlayerDamaged(
    eventPlayer: mod.Player, // The player who took damage.
    eventOtherPlayer: mod.Player, // The player who dealt the damage.
    eventDamageType: mod.DamageType, // The type of damage taken.
    eventWeaponUnlock: mod.WeaponUnlock // The weapon that dealt the damage.
): void {
    // Not going to log anything here as this happens too often.
}

// This will trigger whenever a Player deploys.
export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const map = MapDetector.currentMap();

    if (map) {
        mod.DisplayNotificationMessage(
            mod.Message(
                mod.stringkeys.template.notifications.deployedOnMap,
                eventPlayer,
                mod.stringkeys.template.maps[map]
            ),
            eventPlayer
        );
    } else {
        mod.DisplayNotificationMessage(
            mod.Message(mod.stringkeys.template.notifications.deployed, eventPlayer),
            eventPlayer
        );
    }

    // Single-player map: player will always be ObjId 0.
    if (mod.GetObjId(eventPlayer) != 0) return;

    debugLoop(eventPlayer);
}

// This will trigger whenever a Player dies.
export function OnPlayerDied(
    eventPlayer: mod.Player, // The player who died.
    eventOtherPlayer: mod.Player, // The player who killed the player who died.
    eventDeathType: mod.DeathType, // The type of death.
    eventWeaponUnlock: mod.WeaponUnlock // The weapon that killed the player who died.
): void {
}

// This will trigger when a Player earns a kill against another Player.
export function OnPlayerEarnedKill(
    eventPlayer: mod.Player, // The player who earned the kill.
    eventOtherPlayer: mod.Player, // The player who was killed.
    eventDeathType: mod.DeathType, // The type of death.
    eventWeaponUnlock: mod.WeaponUnlock // The weapon that killed the player who died.
): void {
}

// This will trigger when a Player earns a kill assist.
export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
}

// This will trigger when a Player enters an AreaTrigger.
// Note that AreaTrigger has to be placed in Godot scene, assigned an ObjId and a CollisionPolygon3D(volume).
export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
}

// This will trigger when a Player enters a CapturePoint capturing area.
// Note that CapturePoint has to be placed in Godot scene, assigned an ObjId and a CapturePointArea(volume).
export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
}

// This will trigger when a Player enters a Vehicle seat.
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
}

// This will trigger when a Player enters a Vehicle seat.
export function OnPlayerEnterVehicleSeat(
    eventPlayer: mod.Player,
    eventVehicle: mod.Vehicle,
    eventSeat: mod.Object
): void {
}

// This will trigger when a Player exits an AreaTrigger.
// Note that AreaTrigger has to be placed in Godot scene, assigned an ObjId and a CollisionPolygon3D(volume).
export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
}

// This will trigger when a Player exits a CapturePoint capturing area.
// Note that CapturePoint has to be placed in Godot scene, assigned an ObjId and a CapturePointArea(volume).
export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
}

// This will trigger when a Player exits a Vehicle.
export function OnPlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
}

// This will trigger when a Player exits a Vehicle seat.
export function OnPlayerExitVehicleSeat(
    eventPlayer: mod.Player,
    eventVehicle: mod.Vehicle,
    eventSeat: mod.Object
): void {
}

// This will trigger when a Player interacts with InteractPoint.
export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {
    const interactId = mod.GetObjId(eventInteractPoint);

    // Single-player map: player will always be ObjId 0.
    if (mod.GetObjId(eventPlayer) != 0) return;

    // Hard-wire the expected interact points for reliability.
    if (interactId === INTERACT_PLAY) {
        adminFxShowcase?.togglePlayStopFromInteract();
        return;
    }

    // Ignore other interact points.
}

// This will trigger when a Player joins the game.
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    // Single-player map: player will always be ObjId 0.
    if (mod.GetObjId(eventPlayer) != 0) return;

    // Create once.
    if (adminFxShowcase !== undefined) return;

    adminDebugTool = new DebugTool(eventPlayer);
    adminFxShowcase = new FxShowcase(eventPlayer, mod.CreateVector(FX_POSITION[0], FX_POSITION[1], FX_POSITION[2]), {
        playStop: INTERACT_PLAY,
        cyclePosition: INTERACT_POS,
    });
}

// This will trigger when any player leaves the game.
export function OnPlayerLeaveGame(eventNumber: number): void {
}

// This will trigger when a Player changes team.
export function OnPlayerSwitchTeam(eventPlayer: mod.Player, eventTeam: mod.Team): void {
}

// This will trigger when a Player interacts with an UI button.
export function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): void {
    // The UI module has a static global click handler for all buttons created with the UI module.
    UI.handleButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

// This will trigger when the Player dies and returns to the deploy screen.
export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
}

// This will trigger when a Raycast hits a target.
export function OnRayCastHit(eventPlayer: mod.Player, eventPoint: mod.Vector, eventNormal: mod.Vector): void {
}

// This will trigger when a Raycast is called and doesn't hit any target.
export function OnRayCastMissed(eventPlayer: mod.Player): void {
}

// This will trigger when a Player is revived by another Player.
export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
}

// This will trigger when a RingOfFire changes size.
export function OnRingOfFireZoneSizeChange(eventRingOfFire: mod.RingOfFire, eventNumber: number): void {
}

// This will trigger when an AISpawner spawns an AI Soldier.
export function OnSpawnerSpawned(eventPlayer: mod.Player, eventSpawner: mod.Spawner): void {
}

// This will trigger when the gamemode time limit has been reached.
export function OnTimeLimitReached(): void {
}

// This will trigger when a Vehicle is destroyed.
export function OnVehicleDestroyed(eventVehicle: mod.Vehicle): void {
}

// This will trigger when a Vehicle is called into the map.
export function OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
}

// This will call itself every 5 seconds.
function debugLoop(player: mod.Player): void {
    mod.Wait(0.5).then(() => {
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return;

        adminDebugTool?.staticLog(
            `Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`,
            0
        );
        adminDebugTool?.staticLog(
            `Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`,
            1
        );

        debugLoop(player);
    });
}
