import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { OrderStatus } from "api/types";
import React, { useState } from "react";
import Container from "@material-ui/core/Container";
import { useHistory } from "react-router-dom";
import styles from "components/general/OrderTables/OrderTables.module.scss";
import hardwareImagePlaceholder from "assets/images/placeholders/no-hardware-image.svg";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import {
    GeneralOrderTableTitle,
    GeneralOrderTitle,
} from "components/general/OrderTables/OrderTables";
import { Formik, FormikValues } from "formik";
import { useDispatch, useSelector } from "react-redux";
import {
    clearError,
    getCreditsUsedSelector,
    isLoadingSelector,
    pendingOrdersSelector,
    UpdateOrderAttributes,
    updateOrderStatus,
} from "slices/order/teamOrderSlice";
import { hardwareSelectors } from "slices/hardware/hardwareSlice";
import { teamStartingCreditsSelector } from "slices/event/teamDetailSlice";
import { userSelector } from "slices/users/userSlice"; // get current user to track who is packing
import { AppDispatch } from "slices/store";

const createDropdownList = (number: number) => {
    let entry = [];

    for (let i = 0; i <= number; i++) {
        entry.push(
            <MenuItem key={i} role="quantity" value={i.toString()}>
                {i}
            </MenuItem>
        );
    }

    return entry;
};

const setInitialValues = (
    request: { id: number; quantityRequested: number; quantityGranted: number }[]
) => {
    let orderInitialValues: Record<string, string | boolean> = {};
    request.forEach((orderItem) => {
        orderInitialValues[`${orderItem.id}-quantity`] =
            orderItem.quantityGranted.toString();
        orderInitialValues[`${orderItem.id}-checkbox`] = false;
    });
    return orderInitialValues;
};

export const TeamPendingOrderTable = () => {
    const dispatch = useDispatch<AppDispatch>();
    const history = useHistory();
    const orders = useSelector(pendingOrdersSelector);
    const hardware = useSelector(hardwareSelectors.selectEntities);
    const isLoading = useSelector(isLoadingSelector);
    const [visibility, setVisibility] = useState(true);
    const creditsAvailable = useSelector(teamStartingCreditsSelector);
    const creditsUsed = useSelector(getCreditsUsedSelector);
    const creditsRemaining = creditsAvailable ? creditsAvailable - creditsUsed : 0;
    const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
    const [cancelMsg, setCancelMsg] = useState<string>("");
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const currentUser = useSelector(userSelector); // get current user to check if they're packing

    // Concurrency error dialog state
    const [showConcurrencyError, setShowConcurrencyError] = useState<boolean>(false);
    const [concurrencyErrorMsg, setConcurrencyErrorMsg] = useState<string>("");

    const [selectedQuantities, setSelectedQuantities] = useState<
        Record<number, number>
    >({});

    const handleQuantityChange = (rowId: number, value: unknown) => {
        const parsedValue =
            typeof value === "string"
                ? parseInt(value, 10) || 0
                : typeof value === "number"
                ? value
                : 0;

        setSelectedQuantities((prev: Record<number, number>) => ({
            ...prev,
            [rowId]: parsedValue,
        }));
    };

    const toggleVisibility = () => {
        setVisibility(!visibility);
    };

    // Helper to extract error message from various error shapes
    const getErrorMessage = (error: unknown): string => {
        if (typeof error === "string") return error;
        if (typeof error === "object" && error !== null) {
            const err = error as Record<string, unknown>;
            if (err.message) {
                if (typeof err.message === "string") return err.message;
                if (typeof err.message === "object") return JSON.stringify(err.message);
            }
            if (err.detail) return String(err.detail);
            if (err.error) return String(err.error);
            return JSON.stringify(error);
        }
        return "An unknown error occurred";
    };

    // Handle closing the concurrency error dialog and redirect to orders page
    const handleConcurrencyErrorClose = () => {
        setShowConcurrencyError(false);
        setConcurrencyErrorMsg("");
        history.push("/orders");
    };

    const updateOrder = async (
        orderId: number,
        status: OrderStatus,
        values: FormikValues | null = null,
        cancellationMessage?: string
    ) => {
        const updateOrderData: UpdateOrderAttributes = {
            id: orderId,
            status,
            request: [],
        };

        // If a cancellation message is provided, add it.
        if (cancellationMessage) {
            updateOrderData.cancellation_message = cancellationMessage;
        }

        if (values) {
            const request: Array<{ id: number; requested_quantity: number }> = [];
            const formikKeys = Object.keys(values);
            for (let i = 0; i < formikKeys.length; i += 2) {
                const hardwareId = parseInt(formikKeys[i].split("-")[0]);
                request.push({
                    id: hardwareId,
                    requested_quantity: values[formikKeys[i + 1]]
                        ? parseInt(values[formikKeys[i]])
                        : 0,
                });
            }
            updateOrderData.request = request;
        }

        try {
            await dispatch(updateOrderStatus(updateOrderData)).unwrap();
        } catch (error: unknown) {
            // Show concurrency error dialog for "In Progress" status changes (Start Packing)
            if (status === "In Progress") {
                // Clear the slice error state so TeamDetail doesn't show AlertBox
                dispatch(clearError());
                setConcurrencyErrorMsg(
                    "Another admin might be packing this order. Please refresh the page."
                );
                setShowConcurrencyError(true);
            }
            // For other status changes, the snackbar from the thunk will handle the error
        }
    };

    return (
        <Container
            className={styles.tableContainer}
            maxWidth={false}
            disableGutters={true}
        >
            {orders.length > 0 && (
                <GeneralOrderTitle
                    title="Requested Items"
                    isVisible={visibility}
                    toggleVisibility={toggleVisibility}
                />
            )}
            {visibility &&
                orders.length > 0 &&
                orders.map((pendingOrder) => (
                    <Formik
                        initialValues={setInitialValues(
                            pendingOrder.hardwareInTableRow
                        )}
                        onSubmit={(values) =>
                            updateOrder(pendingOrder.id, "Ready for Pickup", values)
                        }
                        key={pendingOrder.id}
                    >
                        {(props) => {
                            // Calculate the order credit subtotal by iterating over each row.
                            const orderTotalCredits =
                                pendingOrder.hardwareInTableRow.reduce((sum, row) => {
                                    // Use selected quantity if available; otherwise, use the default quantityGrantedBySystem.
                                    const selectedQty =
                                        selectedQuantities[row.id] !== undefined
                                            ? selectedQuantities[row.id]
                                            : row.quantityGrantedBySystem;
                                    // Get the credits per unit for this hardware item.
                                    const creditsPerUnit =
                                        hardware[row.id]?.credits ?? 0;
                                    return sum + selectedQty * creditsPerUnit;
                                }, 0);
                            return (
                                <form onSubmit={props.handleSubmit}>
                                    <div key={pendingOrder.id}>
                                        <GeneralOrderTableTitle
                                            orderId={pendingOrder.id}
                                            orderStatus={pendingOrder.status}
                                            overLimit={creditsRemaining < 0}
                                        />
                                        <TableContainer
                                            component={Paper}
                                            elevation={2}
                                            square={true}
                                            style={{
                                                // highlight orders being packed by current user
                                                border:
                                                    pendingOrder.status ===
                                                        "In Progress" &&
                                                    pendingOrder.packing_admin_id ===
                                                        currentUser?.id
                                                        ? "3px solid #ffa000"
                                                        : "none",
                                                backgroundColor:
                                                    pendingOrder.status ===
                                                        "In Progress" &&
                                                    pendingOrder.packing_admin_id ===
                                                        currentUser?.id
                                                        ? "#fff9f0"
                                                        : "inherit",
                                            }}
                                        >
                                            <Table
                                                className={styles.table}
                                                size="small"
                                            >
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell
                                                            className={
                                                                styles.widthFixed
                                                            }
                                                        />
                                                        <TableCell
                                                            className={styles.width6}
                                                        >
                                                            Name
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width1} ${styles.noWrap}`}
                                                        >
                                                            Model
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width1} ${styles.noWrap}`}
                                                        >
                                                            Manufacturer
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width1} ${styles.noWrap}`}
                                                        >
                                                            💳 Credits
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width1} ${styles.noWrap}`}
                                                        >
                                                            Qty requested
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width1} ${styles.noWrap}`}
                                                        >
                                                            Qty granted by system
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width6} ${styles.noWrap}`}
                                                        >
                                                            Qty granted
                                                        </TableCell>
                                                        <TableCell
                                                            className={`${styles.width1} ${styles.noWrap}`}
                                                        >
                                                            {(pendingOrder.status ===
                                                                "Submitted" ||
                                                                pendingOrder.status ===
                                                                    "In Progress") && (
                                                                <Checkbox
                                                                    color="primary"
                                                                    data-testid={`checkall-${pendingOrder.id}`}
                                                                    onChange={(e) => {
                                                                        pendingOrder.hardwareInTableRow.forEach(
                                                                            (row) => {
                                                                                props.setFieldValue(
                                                                                    `${row.id}-checkbox`,
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                );
                                                                            }
                                                                        );
                                                                    }}
                                                                />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {pendingOrder.hardwareInTableRow.map(
                                                        (row) => {
                                                            const selectedQuantity =
                                                                selectedQuantities[
                                                                    row.id
                                                                ] ??
                                                                row.quantityGrantedBySystem;
                                                            const creditsPerUnit =
                                                                hardware[row.id]
                                                                    ?.credits ?? 0;
                                                            const totalCredits =
                                                                selectedQuantity *
                                                                creditsPerUnit;

                                                            return (
                                                                <TableRow
                                                                    key={row.id}
                                                                    data-testid={`table-${pendingOrder.id}-${row.id}`}
                                                                >
                                                                    <TableCell>
                                                                        <img
                                                                            className={
                                                                                styles.itemImg
                                                                            }
                                                                            src={
                                                                                hardware[
                                                                                    row
                                                                                        .id
                                                                                ]
                                                                                    ?.picture ??
                                                                                hardware[
                                                                                    row
                                                                                        .id
                                                                                ]
                                                                                    ?.image_url ??
                                                                                hardwareImagePlaceholder
                                                                            }
                                                                            alt={
                                                                                hardware[
                                                                                    row
                                                                                        .id
                                                                                ]?.name
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            hardware[
                                                                                row.id
                                                                            ]?.name
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            hardware[
                                                                                row.id
                                                                            ]
                                                                                ?.model_number
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            hardware[
                                                                                row.id
                                                                            ]
                                                                                ?.manufacturer
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell
                                                                        style={{
                                                                            textAlign:
                                                                                "right",
                                                                            color: "#5a6f94",
                                                                        }}
                                                                    >
                                                                        {totalCredits}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        style={{
                                                                            textAlign:
                                                                                "right",
                                                                        }}
                                                                    >
                                                                        {
                                                                            row.quantityRequested
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell
                                                                        style={{
                                                                            textAlign:
                                                                                "right",
                                                                        }}
                                                                    >
                                                                        {
                                                                            row.quantityGrantedBySystem
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {(pendingOrder.status ===
                                                                            "Submitted" ||
                                                                            pendingOrder.status ===
                                                                                "In Progress") && (
                                                                            <div
                                                                                style={{
                                                                                    display:
                                                                                        "flex",
                                                                                    alignItems:
                                                                                        "end",
                                                                                }}
                                                                            >
                                                                                <Link
                                                                                    underline="always"
                                                                                    color="textPrimary"
                                                                                    style={{
                                                                                        marginRight:
                                                                                            "15px",
                                                                                    }}
                                                                                    data-testid={`all-button`}
                                                                                    onClick={() => {
                                                                                        props.setFieldValue(
                                                                                            `${row.id}-quantity`,
                                                                                            row.quantityGrantedBySystem
                                                                                        );
                                                                                        handleQuantityChange(
                                                                                            row.id,
                                                                                            row.quantityGrantedBySystem
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    All
                                                                                </Link>
                                                                                <Select
                                                                                    value={
                                                                                        selectedQuantity
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) => {
                                                                                        props.handleChange(
                                                                                            e
                                                                                        );
                                                                                        handleQuantityChange(
                                                                                            row.id,
                                                                                            e
                                                                                                .target
                                                                                                .value ??
                                                                                                0
                                                                                        );
                                                                                    }}
                                                                                    label="Qty"
                                                                                    labelId="qtyLabel"
                                                                                    name={`${row.id}-quantity`}
                                                                                    id={`${row.id}-quantity`}
                                                                                    data-testid={`select`}
                                                                                >
                                                                                    {createDropdownList(
                                                                                        row.quantityGrantedBySystem
                                                                                    )}
                                                                                </Select>
                                                                            </div>
                                                                        )}
                                                                        {pendingOrder.status ===
                                                                            "Ready for Pickup" && (
                                                                            <p
                                                                                style={{
                                                                                    textAlign:
                                                                                        "center",
                                                                                    ...(row.quantityGranted <
                                                                                        row.quantityGrantedBySystem && {
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                        backgroundColor:
                                                                                            "#c1edc1",
                                                                                    }),
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.quantityGranted
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        {(pendingOrder.status ===
                                                                            "Submitted" ||
                                                                            pendingOrder.status ===
                                                                                "In Progress") && (
                                                                            <Checkbox
                                                                                color="primary"
                                                                                checked={
                                                                                    props
                                                                                        .values[
                                                                                        `${row.id}-checkbox`
                                                                                    ] ===
                                                                                    true
                                                                                }
                                                                                name={`${row.id}-checkbox`}
                                                                                onChange={
                                                                                    props.handleChange
                                                                                }
                                                                                data-testid={`${row.id}-checkbox`}
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        }
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {/* New Credit Subtotal Display */}
                                        <Grid
                                            container
                                            justifyContent="flex-end"
                                            style={{
                                                marginTop: "10px",
                                                marginRight: "10px",
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                color="textPrimary"
                                            >
                                                Credits Used: 💳 {orderTotalCredits}
                                            </Typography>
                                        </Grid>
                                        <Grid
                                            container
                                            justifyContent="flex-end"
                                            spacing={1}
                                            style={{ marginTop: "10px" }}
                                        >
                                            <Grid item style={{ marginTop: "5px" }}>
                                                <Typography variant="body2">
                                                    Note: participants will receive an
                                                    email every time you change the
                                                    status of their order.
                                                </Typography>
                                            </Grid>
                                            {pendingOrder.status === "Submitted" && (
                                                <>
                                                    <Grid item>
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedOrderId(
                                                                    pendingOrder.id
                                                                );
                                                                setShowRejectDialog(
                                                                    true
                                                                );
                                                            }}
                                                            disabled={isLoading}
                                                            color="secondary"
                                                            variant="text"
                                                            disableElevation
                                                        >
                                                            Reject Order
                                                        </Button>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button
                                                            onClick={() =>
                                                                updateOrder(
                                                                    pendingOrder.id,
                                                                    "In Progress"
                                                                )
                                                            }
                                                            disabled={isLoading}
                                                            color="primary"
                                                            variant="outlined"
                                                            disableElevation
                                                            style={{
                                                                backgroundColor:
                                                                    "#ffe3b4",
                                                                borderColor: "#ffa000",
                                                            }}
                                                        >
                                                            Start Packing
                                                        </Button>
                                                    </Grid>
                                                </>
                                            )}
                                            {/* show different buttons when order is being packed */}
                                            {pendingOrder.status === "In Progress" && (
                                                <>
                                                    {/* check if current user is the one packing this order */}
                                                    {pendingOrder.packing_admin_id ===
                                                    currentUser?.id ? (
                                                        <>
                                                            <Grid item>
                                                                <Typography
                                                                    variant="body2"
                                                                    style={{
                                                                        color: "#ffa000",
                                                                        fontWeight:
                                                                            "bold",
                                                                        marginTop:
                                                                            "10px",
                                                                    }}
                                                                >
                                                                    You are currently
                                                                    packing this order
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Button
                                                                    onClick={() =>
                                                                        updateOrder(
                                                                            pendingOrder.id,
                                                                            "Submitted"
                                                                        )
                                                                    }
                                                                    disabled={isLoading}
                                                                    color="secondary"
                                                                    variant="text"
                                                                    disableElevation
                                                                >
                                                                    Stop Packing
                                                                </Button>
                                                            </Grid>
                                                            <Grid item>
                                                                <Button
                                                                    color="primary"
                                                                    variant="contained"
                                                                    type="submit"
                                                                    disableElevation
                                                                    data-testid={`complete-button-${pendingOrder.id}`}
                                                                    disabled={
                                                                        isLoading ||
                                                                        // Check if all quantity fields are zero
                                                                        Object.keys(
                                                                            props.values
                                                                        )
                                                                            .filter(
                                                                                (key) =>
                                                                                    key.endsWith(
                                                                                        "-quantity"
                                                                                    )
                                                                            )
                                                                            .every(
                                                                                (key) =>
                                                                                    props
                                                                                        .values[
                                                                                        key
                                                                                    ] ===
                                                                                    "0"
                                                                            ) ||
                                                                        // Check if no checkbox is selected
                                                                        Object.keys(
                                                                            props.values
                                                                        )
                                                                            .filter(
                                                                                (key) =>
                                                                                    key.endsWith(
                                                                                        "-checkbox"
                                                                                    )
                                                                            )
                                                                            .every(
                                                                                (key) =>
                                                                                    !props
                                                                                        .values[
                                                                                        key
                                                                                    ]
                                                                            )
                                                                    }
                                                                >
                                                                    Complete Packing
                                                                </Button>
                                                            </Grid>
                                                        </>
                                                    ) : (
                                                        <Grid item>
                                                            <Typography
                                                                variant="body2"
                                                                style={{
                                                                    color: "#ffa000",
                                                                    fontWeight: "bold",
                                                                    marginTop: "10px",
                                                                }}
                                                            >
                                                                {pendingOrder.packing_admin_name ||
                                                                    "Another admin"}{" "}
                                                                is currently packing
                                                                this order
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                </>
                                            )}
                                            {pendingOrder.status ===
                                                "Ready for Pickup" && (
                                                <Grid item>
                                                    <Button
                                                        onClick={() =>
                                                            updateOrder(
                                                                pendingOrder.id,
                                                                "Submitted"
                                                            )
                                                        }
                                                        disabled={isLoading}
                                                        color="secondary"
                                                        variant="text"
                                                        disableElevation
                                                    >
                                                        Edit Order
                                                    </Button>
                                                </Grid>
                                            )}
                                            {pendingOrder.status ===
                                                "Ready for Pickup" && (
                                                <Grid item>
                                                    <Tooltip
                                                        title="Ensure that you've collected a piece of ID before the team picks up the order"
                                                        placement="top"
                                                    >
                                                        <span>
                                                            <Button
                                                                color="secondary"
                                                                variant="contained"
                                                                disableElevation
                                                                onClick={() =>
                                                                    updateOrder(
                                                                        pendingOrder.id,
                                                                        "Picked Up"
                                                                    )
                                                                }
                                                            >
                                                                Picked Up
                                                            </Button>
                                                        </span>
                                                    </Tooltip>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </div>
                                </form>
                            );
                        }}
                    </Formik>
                ))}

            <Dialog
                open={showRejectDialog}
                onClose={() => setShowRejectDialog(false)}
                fullWidth
                maxWidth="md" // you can use "sm", "md", "lg", or "xl" as needed
            >
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Cancellation Message (optional)"
                        type="text"
                        fullWidth
                        multiline
                        rows={4} // increases the input area for multiline text
                        value={cancelMsg}
                        onChange={(e) => setCancelMsg(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setShowRejectDialog(false)}
                        color="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (selectedOrderId !== null) {
                                updateOrder(
                                    selectedOrderId,
                                    "Cancelled",
                                    null,
                                    cancelMsg
                                );
                            }
                            setShowRejectDialog(false);
                            setCancelMsg("");
                        }}
                        color="primary"
                    >
                        Confirm Cancellation
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Concurrency Error Dialog - shown when another admin already claimed the order */}
            <Dialog
                open={showConcurrencyError}
                onClose={handleConcurrencyErrorClose}
                aria-labelledby="concurrency-error-dialog-title"
                aria-describedby="concurrency-error-dialog-description"
            >
                <DialogTitle id="concurrency-error-dialog-title">
                    Order Already Being Packed
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="concurrency-error-dialog-description">
                        {concurrencyErrorMsg ||
                            "Another admin is already packing this order. Please select a different order."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleConcurrencyErrorClose}
                        color="primary"
                        variant="contained"
                        autoFocus
                    >
                        Go to Orders
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeamPendingOrderTable;
