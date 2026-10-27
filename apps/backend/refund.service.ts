type RefundStatus ="pending" | "failed" | "partial"|"completed";

type ProviderRefundResult ={
  id string;
  status:"success"|"pending"|"failed"|"unknown";
  refundAmound: number;
};

type refundRecord ={
  id: string;
  orderId: string;
  amount: number;
  status:Refundstatus;
  providerRefundid?:string | null;
};

interface RefundRepository{
  getByid(id:string): Promise<RefundRecord|null>;

  markPending(
    id :string,
    providerRefundid:string):promise<void>;

    markfailedifnotFinal(
      id:string,
      providerRefundId:string
    ); Promise<void>;

    finalizeConfirmedRefund(input:{
      refundId: string;
      providerRefundedId:string;
      confirmedAmound:number;
      status:"partial" | "completed";

    }):Promise<void>;
  
}

interface PaymentProvider{
  createRefund(input:{
    orderId:string;
    amount:number;
    indempotencyKey: string;
  }):Promise<ProviderRefundResult>;
}

export async function processRefund(
  refundId:string,
  repo:RefundRepository,
  provider: PaymentProvider
):Promise<{
  refundId: string;
  status: RefundStatus;
}>{
  const refund = await repo.getByid(refundid);

  if(!refund){
    throw new Error("refund not found");
  }

  if(
    refund.status==="completed" || refund.status==="failed"
  ) {
      return {refundId, status: refund.status};
  }

   const result = await provider.createRefund({
    orderId:refund.orderId,
    amount:refund.amount,
    idempotencykey: 'refund : ${refund.id}',
   });

   if (
    !result || !result.id || !Number.isSafeInteger(result.refundedAmount)||
    result.refundedAmount<0
   ){
    throw new Error("Invalid payment provider refund response");

   }

   if(result.status === "pending" || result.status ==="unknown"){
    await repo.markpending(refund.id,result.id);

    return{
      refundId,status:"pending"
    };
   }
}