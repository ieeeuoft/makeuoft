import React from "react";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import SearchIcon from "@material-ui/icons/Search";
import { Formik, FormikValues } from "formik";

import styles from "pages/Inventory/Inventory.module.scss";
import {
    set3dFilters,
    getHardware3dWithFilters,
    is3dLoadingSelector,
} from "slices/hardware/hardware3dSlice";
import { connect, ConnectedProps } from "react-redux";
import { RootState } from "slices/store";
import { Box } from "@material-ui/core";

interface SearchValues {
    search: string;
}

export const InventorySearch = ({
    handleChange,
    handleReset,
    handleSubmit,
    values: { search },
}: FormikValues) => (
    <form onReset={handleReset} onSubmit={handleSubmit} autoComplete="off">
        <Box display="flex" flexDirection="row">
            <TextField
                className={styles.inventoryBodyToolbarSearch}
                id="search-input"
                name="search"
                label="Search items"
                variant="outlined"
                type="text"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleReset}
                                data-testid="clear-button"
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                value={search}
                onChange={handleChange}
            />
            <IconButton
                color="primary"
                aria-label="Search"
                onClick={handleSubmit}
                data-testid="search-button"
            >
                <SearchIcon />
            </IconButton>
        </Box>
    </form>
);

export const EnhancedInventorySearch = ({
    getHardware3dWithFilters,
    set3dFilters,
}: ConnectedInventorySearchProps) => {
    const initialValues = {
        search: "",
    };

    const onSubmit = ({ search }: SearchValues) => {
        set3dFilters({ search });
        getHardware3dWithFilters();
    };

    const onReset = () => {
        set3dFilters(initialValues);
        getHardware3dWithFilters();
    };

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={onSubmit}
            onReset={onReset}
            validateOnBlur={false}
            validateOnChange={false}
        >
            {(formikProps) => <InventorySearch {...formikProps} />}
        </Formik>
    );
};

const mapStateToProps = (state: RootState) => ({
    isLoading: is3dLoadingSelector(state),
});

const connector = connect(mapStateToProps, {
    getHardware3dWithFilters,
    set3dFilters,
});

type ConnectedInventorySearchProps = ConnectedProps<typeof connector>;

export const ConnectedInventorySearch = connector(EnhancedInventorySearch);

export default ConnectedInventorySearch;
