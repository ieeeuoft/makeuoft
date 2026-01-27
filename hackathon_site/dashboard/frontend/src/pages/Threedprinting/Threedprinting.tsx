import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import Hidden from "@material-ui/core/Hidden";
import Button from "@material-ui/core/Button";
import RefreshIcon from "@material-ui/icons/Refresh";
import FilterListIcon from "@material-ui/icons/FilterList";
import InventorySearch3D from "components/inventory/InventorySearch3D/InventorySearch3D";

import CircularProgress from "@material-ui/core/CircularProgress";

import styles from "./Threedprinting.module.scss";
import Header from "components/general/Header/Header";
import InventoryGrid3D from "components/inventory/InventoryGrid3D/InventoryGrid3D";

import ProductOverview3D from "components/inventory/ProductOverview3D/ProductOverview3D";

import {
    getHardware3dWithFilters,
    getHardware3dNextPage,
    hardware3dCountSelector,
    hardware3dSelectors,
    is3dMoreLoadingSelector,
    is3dLoadingSelector,
    set3dFilters,
} from "slices/hardware/hardware3dSlice";

import { getCategories, selectThreeDPrintingId } from "slices/hardware/categorySlice";
import { Grid } from "@material-ui/core";
import { userTypeSelector } from "slices/users/userSlice";
import DateRestrictionAlert from "components/general/DateRestrictionAlert/DateRestrictionAlert";
import { getCurrentTeam } from "slices/event/teamSlice";
import { getTeamOrders } from "slices/order/orderSlice";

const Threedprinting = () => {
    const dispatch = useDispatch();
    const itemsInStore = useSelector(hardware3dSelectors.selectTotal);
    const count = useSelector(hardware3dCountSelector);
    const isMoreLoading = useSelector(is3dMoreLoadingSelector);
    const isLoading = useSelector(is3dLoadingSelector);
    const userType = useSelector(userTypeSelector);

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const toggleFilter = () => {
        setMobileOpen(!mobileOpen);
    };

    const getMoreHardware = () => {
        dispatch(getHardware3dNextPage());
    };

    const refreshHardware = () => {
        if (threeDPrintingId !== undefined) {
            dispatch(set3dFilters({ category_ids: [threeDPrintingId] }));
        }
        dispatch(getHardware3dWithFilters());
    };

    // When the page is loaded, clear filters and fetch fresh inventory data
    // useEffect(() => {
    //     dispatch(clearFilters());
    //     if(threeDPrintingId != undefined){
    //         dispatch(set3dFilters({ category_ids: [threeDPrintingId] }));
    //     }
    //     dispatch(getHardware3dWithFilters());
    //     dispatch(getCategories());
    //     // Reload team-related data for participants on page reload for accurate credit usage
    //     if (userType === "participant") {
    //         dispatch(getCurrentTeam());
    //         dispatch(getTeamOrders());
    //     }
    // }, [dispatch, userType]);

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    const threeDPrintingId = useSelector(selectThreeDPrintingId);
    console.log("ThreeDprinting ID is ", threeDPrintingId);

    useEffect(() => {
        if (threeDPrintingId) {
            // dispatch(clearFilters());
            dispatch(set3dFilters({ category_ids: [threeDPrintingId] }));
            dispatch(getHardware3dWithFilters());
        }
        if (userType === "participant") {
            dispatch(getCurrentTeam());
            dispatch(getTeamOrders());
        }
    }, [dispatch, userType, threeDPrintingId]);

    return (
        <>
            <Header />
            {/* <ProductOverview showAddToCartButton={userType === "participant"} /> */}
            <ProductOverview3D showAddToCartButton={userType === "participant"} />
            <div className={styles.threedprinting}>
                {/* <Drawer
                    className={styles.threedprintingFilterDrawer}
                    open={mobileOpen}
                    onClose={toggleFilter}
                >
                    <div className={styles.threedprintingFilterDrawerTop}>
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
                </Drawer> */}

                <Typography variant="h1">3D Printing Services</Typography>

                {userType === "participant" && <DateRestrictionAlert />}

                <Grid container spacing={2} className={styles.threedprintingBody}>
                    {/* <Grid item md={3} xl={2}>
                        <Hidden implementation="css" smDown>
                            <threedprintingFilter />
                        </Hidden>
                    </Grid> */}

                    <Grid item xs={12} md={12} xl={12}>
                        <div className={styles.threedprintingBodyToolbar}>
                            <div className={styles.threedprintingBodyToolbarDiv}>
                                <InventorySearch3D />
                            </div>

                            <Divider
                                orientation="vertical"
                                className={styles.threedprintingBodyToolbarDivider}
                                flexItem
                            />

                            <div className={styles.threedprintingBodyToolbarDiv}>
                                <Hidden implementation="css" mdUp>
                                    <Button
                                        aria-label="Filter"
                                        startIcon={<FilterListIcon color="primary" />}
                                        onClick={toggleFilter}
                                    >
                                        Filter
                                    </Button>
                                </Hidden>

                                <div
                                    className={styles.threedprintingBodyToolbarRefresh}
                                >
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
                        <InventoryGrid3D />
                        {count > 0 && (
                            <Divider
                                className={styles.threedprintingLoadDivider}
                                data-testid="threedprintingCountDivider"
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

export default Threedprinting;
