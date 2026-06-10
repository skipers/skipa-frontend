import { ref } from 'vue'

export interface DBPatentEntry {
  id: number
  title: string
  applicationNumber: string
  registrationNumber: string
  applicationDate: string
  expiryDate: string
  techField: string
  status: string
  summary: string
  citationCount: number
}

const approvedPatents = ref<DBPatentEntry[]>([])
let nextDbId = 9000

export function usePatentDatabase() {
  function addApprovedPatent(entry: Omit<DBPatentEntry, 'id'>) {
    if (approvedPatents.value.some(p => p.applicationNumber === entry.applicationNumber)) return
    approvedPatents.value.unshift({ id: nextDbId++, ...entry })
  }
  return { approvedPatents, addApprovedPatent }
}
