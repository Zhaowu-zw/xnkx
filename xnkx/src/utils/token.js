//存储数据
export const SET_TOKEN = (token) => {
    localStorage.setItem('TOKEN', token)
}
//获取数据
export const GET_TOKEN = () => {
    return localStorage.getItem("TOKEN")
}
//删除数据
export const REMOVE_TOKEN = () => {
    return localStorage.removeItem("TOKEN");
}