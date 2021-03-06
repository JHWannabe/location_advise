/**
 *  핀 등록 화면에서 정보를 기입하는 아이템 (라벨 + a)
 */
import {styled} from "@mui/system";
import Box from "@mui/material/Box";
import AddPinLabel from "./AddPinLabel";
import {Input, MenuItem, Select} from "@mui/material";

const Container = styled(Box)(p => ({
    width: `100%`,
    height: `35px`,
    display: `flex`,
    flexDirection: `row`,
    marginBottom: `20px`,
}));

const AddPinItem = ({
    type,
    menuItemList,
    children,

    value,
    onChangeValue,
}) => {
    return (
        <Container>
            <AddPinLabel>
                {children}
            </AddPinLabel>

            {type === 'input' ? (
                <Input sx={{ width: `70%`, height: `100%` }} value={value} onChange={onChangeValue} />
            ) : (
                <Select sx={{ width: `70%`, height: `100%` }} value={value} onChange={onChangeValue} >
                    {menuItemList?.map(item => (
                        <MenuItem key={item?.id} value={item.id}>{item.name}</MenuItem>
                    ))}
                </Select>
            )}
        </Container>
    );
};

export default AddPinItem;