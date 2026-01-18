import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "@material-ui/core/Button";
import LockIcon from "@material-ui/icons/Lock";
import LockOpenIcon from "@material-ui/icons/LockOpen";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
    lockStatusSelector,
    isLoadingSelector,
    toggleLock,
} from "slices/hardware/orderLockSlice";
import { displaySnackbar } from "slices/ui/uiSlice";
import { AppDispatch } from "slices/store";

const OrderLockButton = () => {
    const dispatch = useDispatch<AppDispatch>();
    const lockStatus = useSelector(lockStatusSelector);
    const isLoading = useSelector(isLoadingSelector);

    const handleToggle = async () => {
        const newLockState = !lockStatus.orders_locked;
        try {
            const result = await dispatch(
                toggleLock({
                    orders_locked: newLockState,
                    reason: "",
                })
            );

            if (toggleLock.fulfilled.match(result)) {
                dispatch(
                    displaySnackbar({
                        message: newLockState
                            ? "Order submissions have been locked"
                            : "Order submissions have been unlocked",
                        options: { variant: "success" },
                    })
                );
            } else {
                dispatch(
                    displaySnackbar({
                        message: "Failed to toggle lock status",
                        options: { variant: "error" },
                    })
                );
            }
        } catch (error) {
            dispatch(
                displaySnackbar({
                    message: "Failed to toggle lock status",
                    options: { variant: "error" },
                })
            );
        }
    };

    return (
        <Button
            variant="contained"
            color={lockStatus.orders_locked ? "secondary" : "primary"}
            startIcon={
                isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                ) : lockStatus.orders_locked ? (
                    <LockIcon />
                ) : (
                    <LockOpenIcon />
                )
            }
            onClick={handleToggle}
            disabled={isLoading}
            data-testid="order-lock-button"
        >
            {lockStatus.orders_locked ? "Unlock Orders" : "Lock Orders"}
        </Button>
    );
};

export default OrderLockButton;
