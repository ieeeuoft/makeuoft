import React from "react";
import Grid from "@material-ui/core/Grid";
import styles from "pages/Inventory/Inventory.module.scss";
import Item from "components/inventory/Item/Item";
import { useDispatch, useSelector } from "react-redux";
// import {
//     getUpdatedHardwareDetails,
//     hardwareSelectors,
//     isLoadingSelector,
// } from "slices/hardware/hardwareSlice";
import {
    getUpdatedHardware3dDetails,
    hardware3dSelectors,
    is3dLoadingSelector,
} from "slices/hardware/hardware3dSlice";
import { LinearProgress } from "@material-ui/core";
import hardwareImagePlaceholder from "assets/images/placeholders/no-hardware-image.svg";
import { openProductOverview } from "slices/ui/uiSlice";

export const InventoryGrid = () => {
    const dispatch = useDispatch();
    const items = useSelector(hardware3dSelectors.selectAll);
    const isLoading = useSelector(is3dLoadingSelector);

    const openProductOverviewPanel = (hardwareId: number) => {
        dispatch(getUpdatedHardware3dDetails(hardwareId));
        dispatch(openProductOverview());
    };

    return isLoading ? (
        <LinearProgress
            style={{ width: "100%", marginBottom: "10px" }}
            data-testid="linear-progress"
        />
    ) : (
        <Grid direction="row" spacing={2} container>
            {items.length > 0 &&
                items.map((item) => (
                    <Grid
                        xs={6}
                        sm={4}
                        md={3}
                        lg={2}
                        xl={1}
                        className={styles.Item}
                        key={item.id}
                        item
                        onClick={() => openProductOverviewPanel(item.id)}
                    >
                        <Item
                            image={
                                item.picture ??
                                item.image_url ??
                                hardwareImagePlaceholder
                            }
                            title={item.name}
                            total={item.quantity_available}
                            currentStock={item.quantity_remaining}
                        />
                    </Grid>
                ))}
        </Grid>
    );
};

export default InventoryGrid;
