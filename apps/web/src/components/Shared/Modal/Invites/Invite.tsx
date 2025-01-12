import { STATIC_IMAGES_URL } from '@hey/data/constants';
import { Regex } from '@hey/data/regex';
import { INVITE } from '@hey/data/tracking';
import { useInviteMutation } from '@hey/lens';
import { Button, Form, Input, useZodForm } from '@hey/ui';
import errorToast from '@lib/errorToast';
import { Leafwatch } from '@lib/leafwatch';
import plur from 'plur';
import type { FC } from 'react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { object, string } from 'zod';

const inviteSchema = object({
  address: string()
    .max(42, { message: 'Ethereum address should be within 42 characters' })
    .regex(Regex.ethereumAddress, { message: 'Invalid Ethereum address' })
});

interface InviteProps {
  invitesLeft: number;
  refetch: () => void;
}

const Invite: FC<InviteProps> = ({ invitesLeft, refetch }) => {
  const [inviting, setInviting] = useState(false);

  const form = useZodForm({
    schema: inviteSchema
  });

  const onError = (error: any) => {
    setInviting(false);
    errorToast(error);
  };

  const [inviteAddress] = useInviteMutation({
    onCompleted: async () => {
      await refetch();
      form.reset();
      setInviting(false);
      Leafwatch.track(INVITE.INVITE);

      return toast.success('Invited successfully!');
    },
    onError
  });

  const invite = async (address: string) => {
    try {
      setInviting(true);

      return await inviteAddress({
        variables: { request: { invites: [address] } }
      });
    } catch (error) {
      onError(error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <img
          src={`${STATIC_IMAGES_URL}/emojis/handshake.png`}
          alt="Invite"
          className="h-16 w-16"
        />
        <div className="text-xl">Invite a Fren</div>
        <p className="lt-text-gray-500">
          Send invites to your frens so they can create an Lens account. You can
          invite a user only once.
        </p>
        <div className="pt-2 font-mono text-lg">
          <b>
            {invitesLeft} {plur('invite', invitesLeft)}
          </b>{' '}
          available!
        </div>
      </div>
      {invitesLeft !== 0 ? (
        <Form
          form={form}
          className="mt-5 space-y-4"
          onSubmit={async ({ address }) => {
            await invite(address);
          }}
        >
          <Input
            className="text-sm"
            type="text"
            placeholder="0x3A5bd...5e3"
            {...form.register('address')}
          />
          <Button type="submit" disabled={inviting}>
            Invite
          </Button>
        </Form>
      ) : null}
    </div>
  );
};

export default Invite;
