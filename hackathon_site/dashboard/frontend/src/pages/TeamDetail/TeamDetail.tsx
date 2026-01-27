import React, { useEffect, useState } from "react";
import styles from "./TeamDetail.module.scss";

import TeamInfoTable from "components/teamDetail/TeamInfoTable/TeamInfoTable";
import TeamActionTable from "components/teamDetail/TeamActionTable/TeamActionTable";

import { RouteComponentProps } from "react-router-dom";
import Header from "components/general/Header/Header";
import { Grid, Divider, TextField, IconButton } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";
import { AdminReturnedItemsTable } from "components/teamDetail/SimpleOrderTables/SimpleOrderTables";
import {
    errorSelector,
    getAdminTeamOrders,
    getCreditsUsedSelector,
    hardwareInOrdersSelector,
} from "slices/order/teamOrderSlice";

import { useDispatch, useSelector } from "react-redux";
import {
    getTeamInfoData,
    teamInfoErrorSelector,
    teamStartingCreditsSelector,
    updateParticipantIdErrorSelector,
    updateTeamCredits,
} from "slices/event/teamDetailSlice";
import AlertBox from "components/general/AlertBox/AlertBox";
import TeamCheckedOutOrderTable from "components/teamDetail/TeamCheckedOutOrderTable/TeamCheckedOutOrderTable";
import { getHardwareWithFilters, setFilters } from "slices/hardware/hardwareSlice";
import { getCategories } from "slices/hardware/categorySlice";
import ProductOverview from "components/inventory/ProductOverview/ProductOverview";
import TeamPendingOrderTable from "components/teamDetail/TeamPendingOrderTable/TeamPendingOrderTable";
import ProjectDescriptionDetail from "components/teamDetail/ProjectDescription/ProjectDescriptionDetail";

export interface PageParams {
    code: string;
}

const TeamDetail = ({ match }: RouteComponentProps<PageParams>) => {
    const dispatch = useDispatch();

    const hardwareIdsRequired = useSelector(hardwareInOrdersSelector);
    const teamCode = match.params.code.toUpperCase();
    const teamInfoError = useSelector(teamInfoErrorSelector);
    const orderError = useSelector(errorSelector);
    const creditsAvailable = useSelector(teamStartingCreditsSelector);
    const creditsUsed = useSelector(getCreditsUsedSelector);
    const creditsRemaining = creditsAvailable ? creditsAvailable - creditsUsed : 0;

    // Credits editing state
    const [isEditingCredits, setIsEditingCredits] = useState(false);
    const [editedCredits, setEditedCredits] = useState(creditsAvailable);

    // Update editedCredits when creditsAvailable changes
    useEffect(() => {
        setEditedCredits(creditsAvailable);
    }, [creditsAvailable]);

    const updateParticipantIdError = useSelector(updateParticipantIdErrorSelector);
    if (
        updateParticipantIdError === "Could not update participant id status: Error 404"
    ) {
        dispatch(getTeamInfoData(teamCode));
    }

    useEffect(() => {
        dispatch(getTeamInfoData(teamCode));
        dispatch(getCategories());
        dispatch(getAdminTeamOrders(teamCode));
    }, [dispatch, teamCode]);

    useEffect(() => {
        if (hardwareIdsRequired) {
            dispatch(setFilters({ hardware_ids: hardwareIdsRequired }));
            dispatch(getHardwareWithFilters());
        }
    }, [dispatch, hardwareIdsRequired]);

    const handleSaveCredits = () => {
        if (editedCredits >= 0) {
            dispatch(updateTeamCredits({ teamCode, credits: editedCredits }));
            setIsEditingCredits(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedCredits(creditsAvailable);
        setIsEditingCredits(false);
    };

    return (
        <>
            <Header />
            <ProductOverview showAddToCartButton={false} />
            {teamInfoError ? (
                <AlertBox error={teamInfoError} />
            ) : (
                <Grid container direction="column" spacing={6}>
                    <Grid item xs={12}>
                        <Typography variant="h1">Team {teamCode} Overview</Typography>
                        {/* Credits Editor Section */}
                        <div
                            className={styles.creditsSection}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                marginTop: "12px",
                                padding: "12px 16px",
                                backgroundColor: "#f5f5f5",
                                borderRadius: "8px",
                            }}
                        >
                            {isEditingCredits ? (
                                <>
                                    <TextField
                                        label="Total Credits"
                                        type="number"
                                        value={editedCredits}
                                        onChange={(e) =>
                                            setEditedCredits(
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        size="small"
                                        variant="outlined"
                                        style={{ width: "120px" }}
                                        inputProps={{ min: 0 }}
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={handleSaveCredits}
                                        size="small"
                                        title="Save"
                                    >
                                        <SaveIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={handleCancelEdit}
                                        size="small"
                                        title="Cancel"
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </>
                            ) : (
                                <>
                                    <Typography variant="body1">
                                        💳 <strong>Total Credits:</strong>{" "}
                                        {creditsAvailable}
                                    </Typography>
                                    <IconButton
                                        color="primary"
                                        onClick={() => setIsEditingCredits(true)}
                                        size="small"
                                        title="Edit Credits"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </>
                            )}
                            <Divider
                                orientation="vertical"
                                flexItem
                                style={{ margin: "0 8px" }}
                            />
                            <Typography variant="body1">
                                📊 <strong>Used:</strong> {creditsUsed}
                            </Typography>
                            <Divider
                                orientation="vertical"
                                flexItem
                                style={{ margin: "0 8px" }}
                            />
                            <Typography
                                variant="body1"
                                style={{
                                    color: creditsRemaining < 0 ? "red" : "inherit",
                                }}
                            >
                                💰 <strong>Remaining:</strong> {creditsRemaining}
                            </Typography>
                        </div>
                    </Grid>
                    <Grid
                        item
                        container
                        spacing={2}
                        justifyContent="space-between"
                        xs={12}
                        style={{
                            alignSelf: "center",
                        }}
                    >
                        <TeamInfoTable />
                        <TeamActionTable />
                    </Grid>
                    <Grid item container direction="column" spacing={2}>
                        {orderError ? (
                            <AlertBox error={orderError} />
                        ) : (
                            <>
                                {/*<SimplePendingOrderFulfillmentTable />*/}
                                <ProjectDescriptionDetail />
                                <TeamPendingOrderTable />
                                <Divider className={styles.dividerMargin} />
                                <TeamCheckedOutOrderTable />
                                <Divider className={styles.dividerMargin} />
                                <AdminReturnedItemsTable />
                            </>
                        )}
                    </Grid>
                </Grid>
            )}
        </>
    );
};

export default TeamDetail;
