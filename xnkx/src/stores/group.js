import { defineStore } from 'pinia';
import { ref } from 'vue'
import {
    getGroupInfo,
    getGroupMemberShow,
    createGroupInfo,
    putGroupInfo,
    deleteGroupInfo
} from '@/api/group'

const useGroupStore = defineStore('group', () => {
    // 状态定义
    let groupInfo = ref([])
    let isGroupInfoFetched = ref(false)
    let groupMemberShow = ref([])
    let groupMemberCount = ref({})

    // ========== 原有查询方法 ==========
    // 获取所有小组基础信息
    // 修复GetGroupInfo方法：读取res.data.data
    const GetGroupInfo = async () => {
        try {
            // console.log('开始获取小组信息...')
            const res = await getGroupInfo()
            // console.log('获取小组信息成功:', res)

            // 1. 校验业务状态码
            if (res.code !== 200) {
                return Promise.reject(new Error(res.message || '获取小组信息失败'));
            }
            // 2. 读取双层data中的小组列表（res.data.data）
            const groupList = res.data?.data || []
            groupInfo.value = groupList
            isGroupInfoFetched.value = true
            // console.log('更新groupInfo:', groupInfo.value)
            return groupList
        } catch (error) {
            // console.error('获取小组信息失败:', error)
            return Promise.reject(new Error(error.message || '获取小组信息失败'));
        }
    }

    // 获取小组的成员信息，支持传入groupId获取指定小组，不传则获取所有小组
    const GetGroupMemberShow = async (groupId = '') => {
        try {
            const res = await getGroupMemberShow(groupId);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.data || '获取小组人员信息失败'));
            }
            groupMemberShow.value = res.data.data
            calculateGroupMemberCount(res.data.data)
            return res.data.data
        } catch (error) {
            return Promise.reject(new Error(error.message || '获取小组人员信息失败'))
        }
    }

    // 计算各小组的成员数量
    const calculateGroupMemberCount = (memberData) => {
        if (!Array.isArray(memberData)) {
            groupMemberCount.value = {}
            return
        }

        const countObj = {}
        memberData.forEach(groupItem => {
            const groupId = groupItem.id
            const groupName = groupItem.group_name
            const memberCount = Array.isArray(groupItem.member_shows) ? groupItem.member_shows.length : 0

            countObj[groupId] = memberCount
            countObj[groupName] = memberCount
        })
        groupMemberCount.value = countObj
    }

    // ========== 新增：创建小组 ==========
    /**
     * 创建新小组
     * @param {Object} groupForm - 新建小组的表单数据（如group_name、desc等）
     * @returns {Promise<Object>} 新建的小组信息
     */
    const CreateGroupInfo = async (groupForm) => {
        // 入参校验
        if (!groupForm || typeof groupForm !== 'object') {
            return Promise.reject(new Error('创建小组的表单数据不能为空'));
        }
        try {
            const res = await createGroupInfo(groupForm);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.data || '创建小组失败'));
            }
            // 创建成功后重新拉取小组列表，保证本地状态和服务端同步
            await GetGroupInfo();
            return res.data.data;
        } catch (error) {
            return Promise.reject(new Error(error.message || '创建小组失败'));
        }
    }

    // ========== 新增：修改小组 ==========
    /**
     * 修改小组信息
     * @param {string/number} groupId - 要修改的小组ID
     * @param {Object} updateForm - 要修改的表单数据
     * @returns {Promise<Object>} 修改后的小组信息
     */
    const PutGroupInfo = async (groupId, updateForm) => {
        // 入参校验
        if (!groupId) {
            return Promise.reject(new Error('小组ID不能为空'));
        }
        if (!updateForm || typeof updateForm !== 'object') {
            return Promise.reject(new Error('修改的表单数据不能为空'));
        }
        try {
            // 适配接口传参（根据实际API要求调整，若接口需要把ID包含在updateForm里可修改）
            const res = await putGroupInfo(groupId, updateForm);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.data || '修改小组失败'));
            }
            // 修改成功后重新拉取小组列表
            await GetGroupInfo();
            // 若当前正查看该小组的成员信息，同步刷新成员数据
            if (groupMemberShow.value) {
                await GetGroupMemberShow(groupId);
            }
            return res.data.data;
        } catch (error) {
            return Promise.reject(new Error(error.message || '修改小组失败'));
        }
    }

    // ========== 新增：删除小组 ==========
    /**
     * 删除指定小组
     * @param {string/number} groupId - 要删除的小组ID
     * @returns {Promise<Object>} 接口返回的删除结果
     */
    const DeleteGroupInfo = async (groupId) => {
        // 入参校验
        if (!groupId) {
            return Promise.reject(new Error('小组ID不能为空'));
        }
        try {
            const res = await deleteGroupInfo(groupId);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.data || '删除小组失败'));
            }
            // 删除成功后：1. 刷新小组列表 2. 清空该小组的成员信息（避免脏数据）
            await GetGroupInfo();
            if (groupMemberShow.value) {
                // 判断当前成员信息是否包含被删除的小组，若是则清空
                const isTargetGroup = Array.isArray(groupMemberShow.value)
                    ? groupMemberShow.value.some(item => item.id === groupId)
                    : groupMemberShow.value?.id === groupId;
                if (isTargetGroup) {
                    groupMemberShow.value = null;
                    groupMemberCount.value = {};
                }
            }
            return res.data;
        } catch (error) {
            return Promise.reject(new Error(error.message || '删除小组失败'));
        }
    }

    // 暴露状态和方法
    return {
        groupInfo,
        isGroupInfoFetched,
        groupMemberShow,
        groupMemberCount,
        GetGroupInfo,
        GetGroupMemberShow,
        CreateGroupInfo, // 新增：创建小组
        PutGroupInfo,    // 新增：修改小组
        DeleteGroupInfo  // 新增：删除小组
    }
})

export default useGroupStore