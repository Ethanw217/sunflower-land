import React, { useContext, useState } from "react";
import { Balance } from "components/Balance";
import { useActor } from "@xstate/react";
import * as AuthProvider from "features/auth/lib/Provider";
import { Context } from "features/game/GameProvider";
import { Inventory } from "./components/inventory/Inventory";
import { BumpkinProfile } from "./components/BumpkinProfile";
import { BlockBucks } from "./components/BlockBucks";
import Decimal from "decimal.js-light";
import { DepositArgs } from "lib/blockchain/Deposit";
import Modal from "react-bootstrap/esm/Modal";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { Deposit } from "features/goblins/bank/components/Deposit";
import { placeEvent } from "features/game/expansion/placeable/landscapingMachine";
import { createPortal } from "react-dom";

/**
 * Heads up display - a concept used in games for the small overlaid display of information.
 * Balances, Inventory, actions etc.
 */
const HudComponent: React.FC = () => {
  const { authService } = useContext(AuthProvider.Context);
  const { gameService, shortcutItem, selectedItem } = useContext(Context);
  const [gameState] = useActor(gameService);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositDataLoaded, setDepositDataLoaded] = useState(false);

  const autosaving = gameState.matches("autosaving");

  const handleClose = () => {
    setShowDepositModal(false);
  };

  const handleDeposit = (
    args: Pick<DepositArgs, "sfl" | "itemIds" | "itemAmounts">
  ) => {
    gameService.send("DEPOSIT", args);
  };

  const user = authService.state.context.user;
  const isFullUser = user.type === "FULL";
  const farmAddress = isFullUser ? user.farmAddress : undefined;

  return (
    <>
      {createPortal(
        <div
          data-html2canvas-ignore="true"
          aria-label="Hud"
          className="absolute z-40"
        >
          <div>
            <Inventory
              state={gameState.context.state}
              isFullUser={isFullUser}
              shortcutItem={shortcutItem}
              selectedItem={selectedItem}
              onPlace={(selected) => {
                gameService.send("LANDSCAPE", {
                  action: placeEvent(selected),
                  placeable: selected,
                  multiple: true,
                });
              }}
              onDepositClick={() => setShowDepositModal(true)}
              isSaving={autosaving}
              isFarming={false}
            />
          </div>

          <Balance
            onBalanceClick={
              farmAddress ? () => setShowDepositModal(true) : undefined
            }
            balance={gameState.context.state.balance}
          />
          <BlockBucks
            blockBucks={
              gameState.context.state.inventory["Block Buck"] ?? new Decimal(0)
            }
            isFullUser={isFullUser}
          />

          <BumpkinProfile isFullUser={isFullUser} />

          {farmAddress && (
            <Modal show={showDepositModal} centered>
              <CloseButtonPanel
                title={depositDataLoaded ? "Deposit" : undefined}
                onClose={depositDataLoaded ? handleClose : undefined}
              >
                <Deposit
                  farmAddress={farmAddress}
                  onDeposit={handleDeposit}
                  onLoaded={(loaded) => setDepositDataLoaded(loaded)}
                  onClose={handleClose}
                />
              </CloseButtonPanel>
            </Modal>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export const WorldHud = React.memo(HudComponent);