import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import FilterListIcon from "@material-ui/icons/FilterList";
import RefreshIcon from "@material-ui/icons/Refresh";
import AlertBox from "components/general/AlertBox/AlertBox";
import InventorySearch from "components/inventory/InventorySearch/InventorySearch";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Header from "components/general/Header/Header";
import InventoryFilter from "components/inventory/InventoryFilter/InventoryFilter";
import InventoryGrid from "components/inventory/InventoryGrid/InventoryGrid";
import ProductOverview from "components/inventory/ProductOverview/ProductOverview";
import styles from "./Inventory.module.scss";

import { Grid } from "@material-ui/core";
import DateRestrictionAlert from "components/general/DateRestrictionAlert/DateRestrictionAlert";
import { getCurrentTeam } from "slices/event/teamSlice";
import {
    getCategories,
    selectThreeDPrintingIdAsArray,
} from "slices/hardware/categorySlice";
import {
    clearFilters,
    getHardwareNextPage,
    getHardwareWithFilters,
    hardwareCountSelector,
    hardwareSelectors,
    isLoadingSelector,
    isMoreLoadingSelector,
    setFilters,
} from "slices/hardware/hardwareSlice";
import { getTeamOrders } from "slices/order/orderSlice";
import { userTypeSelector } from "slices/users/userSlice";

const Inventory = () => {
    const dispatch = useDispatch();
    const itemsInStore = useSelector(hardwareSelectors.selectTotal);
    const count = useSelector(hardwareCountSelector);
    const isMoreLoading = useSelector(isMoreLoadingSelector);
    const isLoading = useSelector(isLoadingSelector);
    const userType = useSelector(userTypeSelector);
    const threeDPrintingIdArray = useSelector(selectThreeDPrintingIdAsArray);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const toggleFilter = () => {
        setMobileOpen(!mobileOpen);
    };

    const getMoreHardware = () => {
        dispatch(getHardwareNextPage());
    };

    const refreshHardware = () => {
        if (threeDPrintingIdArray && threeDPrintingIdArray.length > 0) {
            dispatch(setFilters({ exclude_category_ids: threeDPrintingIdArray }));
        }
        dispatch(getHardwareWithFilters());
    };

    // On mount: clear filters, then fetch categories and hardware. The hardware
    // fetch is unconditional so the inventory always loads, even if the
    // "3D Printing" category doesn't exist (or its fetch is slow/fails).
    useEffect(() => {
        dispatch(clearFilters());
        dispatch(getCategories());
        dispatch(getHardwareWithFilters());
    }, [dispatch]);

    // Once the "3D Printing" category is known, exclude it from the inventory
    // and refetch. If there is no such category, the inventory stays as-is.
    useEffect(() => {
        if (threeDPrintingIdArray && threeDPrintingIdArray.length > 0) {
            dispatch(setFilters({ exclude_category_ids: threeDPrintingIdArray }));
            dispatch(getHardwareWithFilters());
        }
    }, [dispatch, threeDPrintingIdArray]);

    // Participant-specific data (separate from hardware)
    useEffect(() => {
        if (userType === "participant") {
            dispatch(getCurrentTeam());
            dispatch(getTeamOrders());
        }
    }, [dispatch, userType]);

    return (
        <>
            <Header />
            <ProductOverview showAddToCartButton={userType === "participant"} />
            <div className={styles.inventory}>
                <Drawer
                    className={styles.inventoryFilterDrawer}
                    open={mobileOpen}
                    onClose={toggleFilter}
                >
                    <div className={styles.inventoryFilterDrawerTop}>
                        <Typography variant="h2">Filters</Typography>
                        <IconButton
                            color="inherit"
                            aria-label="CloseFilter"
                            onClick={toggleFilter}
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <InventoryFilter />
                </Drawer>

                <Typography variant="h1">Hardware Inventory</Typography>
                <AlertBox
                    type="warning"
                    title="Cart Checking"
                    error="Your cart is not shared with teammates. Please coordinate with your team to submit a single consolidated order and avoid ordering duplicate items."
                />
                <AlertBox
                    title={"Disclaimer"}
                    error={
                        "Note: Hardware picture and links may not be accurate to distributed parts. Substitutions may be made on the day of the event."
                    }
                    type={"info"}
                />
                <AlertBox
                    title={"For 3D Printing"}
                    error={
                        'Note: Please go to the "3D Printing Services" tab for 3D Printer usage booking. Thank you!'
                    }
                    type={"info"}
                />

                {userType === "participant" && <DateRestrictionAlert />}

                <Grid container spacing={2} className={styles.inventoryBody}>
                    <Grid item md={3} xl={2}>
                        <Hidden implementation="css" smDown>
                            <InventoryFilter />
                        </Hidden>
                    </Grid>

                    <Grid item md={9} xl={10}>
                        <div className={styles.inventoryBodyToolbar}>
                            <div className={styles.inventoryBodyToolbarDiv}>
                                <InventorySearch />
                            </div>

                            <Divider
                                orientation="vertical"
                                className={styles.inventoryBodyToolbarDivider}
                                flexItem
                            />

                            <div className={styles.inventoryBodyToolbarDiv}>
                                <Hidden implementation="css" mdUp>
                                    <Button
                                        aria-label="Filter"
                                        startIcon={<FilterListIcon color="primary" />}
                                        onClick={toggleFilter}
                                    >
                                        Filter
                                    </Button>
                                </Hidden>

                                <div className={styles.inventoryBodyToolbarRefresh}>
                                    <Typography variant="body2">
                                        {count} results
                                    </Typography>
                                    <IconButton
                                        color="primary"
                                        aria-label="Refresh"
                                        onClick={refreshHardware}
                                        data-testid="refreshInventory"
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                        <InventoryGrid />
                        {count > 0 && (
                            <Divider
                                className={styles.inventoryLoadDivider}
                                data-testid="inventoryCountDivider"
                            />
                        )}
                        <Typography
                            variant="subtitle2"
                            align="center"
                            paragraph
                            style={{ marginTop: count <= 0 ? "30px" : 0 }}
                        >
                            {count > 0
                                ? `SHOWING ${itemsInStore} OF ${count} ITEMS`
                                : isLoading
                                ? "LOADING"
                                : "NO ITEMS FOUND"}
                        </Typography>
                        {count !== itemsInStore && (
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                fullWidth={true}
                                disableElevation
                                onClick={getMoreHardware}
                            >
                                {isMoreLoading ? (
                                    <CircularProgress
                                        size={25}
                                        data-testid="load-more-hardware-circular-progress"
                                    />
                                ) : (
                                    "Load more"
                                )}
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </div>
        </>
    );
};

export default Inventory;
